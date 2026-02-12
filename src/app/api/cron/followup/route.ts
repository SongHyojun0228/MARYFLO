import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAlimtalk } from "@/lib/solapi";

interface FollowupStep {
  delayDays: number;
  templateTrigger: string;
}

/**
 * Replace template variables like {{name}}, {{date}} with actual values.
 */
function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || "");
}

/**
 * GET /api/cron/followup
 *
 * Cron job that runs every 30 minutes (via Vercel Cron).
 * Finds leads with pending followups and sends the next message in sequence.
 *
 * Authorization: Bearer CRON_SECRET header required.
 */
export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };

  try {
    // Find leads with pending followups
    const leads = await prisma.lead.findMany({
      where: {
        sequenceActive: true,
        nextFollowupAt: { lte: new Date() },
      },
      include: {
        business: {
          select: { id: true, name: true },
        },
      },
    });

    summary.processed = leads.length;

    for (const lead of leads) {
      try {
        // Find active followup sequence for this business
        const sequence = await prisma.followupSequence.findFirst({
          where: {
            businessId: lead.businessId,
            isActive: true,
          },
        });

        if (!sequence) {
          // No active sequence — deactivate followup on this lead
          await prisma.lead.update({
            where: { id: lead.id },
            data: { sequenceActive: false, nextFollowupAt: null },
          });
          summary.errors.push(`Lead ${lead.id}: no active sequence found`);
          summary.failed++;
          continue;
        }

        const steps = sequence.steps as unknown as FollowupStep[];
        const currentStep = lead.currentSequenceStep;

        if (currentStep >= steps.length) {
          // All steps completed — deactivate
          await prisma.lead.update({
            where: { id: lead.id },
            data: { sequenceActive: false, nextFollowupAt: null },
          });
          continue;
        }

        const step = steps[currentStep];

        // Find the template matching this trigger
        const template = await prisma.messageTemplate.findFirst({
          where: {
            businessId: lead.businessId,
            trigger: step.templateTrigger as "AUTO_REPLY" | "QUOTE_SENT" | "FOLLOWUP_D3" | "FOLLOWUP_D7" | "FOLLOWUP_D14" | "CONTRACT_CONGRATS" | "REVIEW_REQUEST" | "CUSTOM",
            isActive: true,
          },
        });

        if (!template) {
          summary.errors.push(
            `Lead ${lead.id}: no template for trigger ${step.templateTrigger}`
          );
          // Skip to next step instead of failing entirely
          const nextStep = currentStep + 1;
          if (nextStep < steps.length) {
            const nextFollowupAt = new Date();
            nextFollowupAt.setDate(nextFollowupAt.getDate() + steps[nextStep].delayDays);
            await prisma.lead.update({
              where: { id: lead.id },
              data: { currentSequenceStep: nextStep, nextFollowupAt },
            });
          } else {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { sequenceActive: false, nextFollowupAt: null },
            });
          }
          summary.failed++;
          continue;
        }

        // Build template variables
        const variables: Record<string, string> = {
          name: lead.name,
          date: lead.desiredDate
            ? `${lead.desiredDate.getMonth() + 1}월 ${lead.desiredDate.getDate()}일`
            : "",
          guest_count: lead.guestCount?.toString() || "",
          business_name: lead.business.name,
        };

        const renderedContent = replaceTemplateVariables(
          template.content,
          variables
        );

        // Create Message record (PENDING)
        const messageRecord = await prisma.message.create({
          data: {
            leadId: lead.id,
            templateId: template.id,
            type: "ALIMTALK",
            content: renderedContent,
            status: "PENDING",
          },
        });

        // Send via Solapi
        const solapiTemplateId =
          process.env[`SOLAPI_${step.templateTrigger}_TEMPLATE_ID`] ||
          template.id;

        const result = await sendAlimtalk({
          to: lead.phone,
          templateId: solapiTemplateId,
          variables,
          smsContent: renderedContent,
        });

        // Update Message status and type based on actual send method
        await prisma.message.update({
          where: { id: messageRecord.id },
          data: {
            status: result.success ? "SENT" : "FAILED",
            sentAt: result.success ? new Date() : null,
            solapiMsgId: result.messageId || null,
            type: result.method === "sms" ? "SMS" : "ALIMTALK",
          },
        });

        // Record FOLLOWUP_SENT activity
        await prisma.activity.create({
          data: {
            leadId: lead.id,
            type: "FOLLOWUP_SENT",
            content: result.success
              ? `팔로업 메시지가 발송되었습니다. (단계 ${currentStep + 1}/${steps.length})`
              : `팔로업 메시지 발송에 실패했습니다: ${result.error}`,
            metadata: JSON.parse(
              JSON.stringify({
                messageId: messageRecord.id,
                solapiMsgId: result.messageId,
                sequenceStep: currentStep,
                trigger: step.templateTrigger,
                success: result.success,
              })
            ),
          },
        });

        // Advance to next step
        const nextStep = currentStep + 1;
        if (nextStep < steps.length) {
          const nextFollowupAt = new Date();
          nextFollowupAt.setDate(
            nextFollowupAt.getDate() + steps[nextStep].delayDays
          );
          await prisma.lead.update({
            where: { id: lead.id },
            data: { currentSequenceStep: nextStep, nextFollowupAt },
          });
        } else {
          // Last step completed — deactivate sequence
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              sequenceActive: false,
              nextFollowupAt: null,
              currentSequenceStep: nextStep,
            },
          });
        }

        summary.succeeded++;
      } catch (leadError) {
        const errorMsg =
          leadError instanceof Error ? leadError.message : "Unknown error";
        summary.errors.push(`Lead ${lead.id}: ${errorMsg}`);
        summary.failed++;
      }
    }

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error("Followup cron error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다.", summary },
      { status: 500 }
    );
  }
}
