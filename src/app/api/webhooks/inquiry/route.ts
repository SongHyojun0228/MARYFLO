import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseInquiry } from "@/lib/openai";
import { sendAlimtalk } from "@/lib/solapi";
import { sendSlackNotification } from "@/lib/slack";
import { ratelimit, getClientIp } from "@/lib/ratelimit";

interface InquiryBody {
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  desiredDate?: string;
  guestCount?: number;
  budgetRange?: string;
  message: string;
  source?: string;
}

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

export async function POST(request: Request) {
  // Rate limiting (skip in dev when Upstash is not configured)
  if (ratelimit) {
    const ip = getClientIp(request);
    const { success, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": remaining.toString() },
        }
      );
    }
  }

  try {
    const body: InquiryBody = await request.json();
    const { businessId, name, phone, email, desiredDate, guestCount, budgetRange, message, source } = body;

    if (!businessId || !name || !phone || !message) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // Verify business exists (include fields needed for notifications)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slackWebhook: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "존재하지 않는 업체입니다." },
        { status: 404 }
      );
    }

    // Build raw inquiry text for AI parsing
    const rawInquiry = [
      `이름: ${name}`,
      `연락처: ${phone}`,
      desiredDate ? `희망 날짜: ${desiredDate}` : null,
      guestCount ? `예상 인원: ${guestCount}명` : null,
      `문의 내용: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    // AI parse the inquiry
    const parsed = await parseInquiry(rawInquiry);

    // Determine priority from AI urgency
    const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "URGENT"> = {
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
    };

    // Create Lead
    const lead = await prisma.lead.create({
      data: {
        businessId,
        name: parsed.name || name,
        phone: parsed.phone || phone,
        email: email || null,
        source: (source as "WEBSITE" | "INSTAGRAM_DM" | "KAKAO" | "NAVER_FORM" | "PHONE" | "OTHER") || "WEBSITE",
        desiredDate: parsed.desired_date
          ? new Date(parsed.desired_date)
          : desiredDate
            ? new Date(desiredDate)
            : null,
        guestCount: parsed.guest_count ?? guestCount ?? null,
        budgetRange: parsed.budget_range || budgetRange || null,
        rawInquiry,
        parsedData: JSON.parse(JSON.stringify(parsed)),
        priority: priorityMap[parsed.urgency] || "MEDIUM",
        status: "NEW",
      },
    });

    // Record INQUIRY_RECEIVED activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "INQUIRY_RECEIVED",
        content: parsed.summary || `${name}님의 새 문의가 접수되었습니다.`,
        metadata: JSON.parse(JSON.stringify({ source: source || "WEBSITE", parsedBy: "gpt-4o-mini" })),
      },
    });

    // --- Step a-f: Auto-reply alimtalk ---
    try {
      const autoReplyTemplate = await prisma.messageTemplate.findFirst({
        where: {
          businessId,
          trigger: "AUTO_REPLY",
          isActive: true,
        },
      });

      if (autoReplyTemplate) {
        const templateVariables: Record<string, string> = {
          name: lead.name,
          date: lead.desiredDate
            ? `${lead.desiredDate.getMonth() + 1}월 ${lead.desiredDate.getDate()}일`
            : "",
          guest_count: lead.guestCount?.toString() || "",
          business_name: business.name,
        };

        const renderedContent = replaceTemplateVariables(
          autoReplyTemplate.content,
          templateVariables
        );

        // Create Message record (PENDING)
        const messageRecord = await prisma.message.create({
          data: {
            leadId: lead.id,
            templateId: autoReplyTemplate.id,
            type: "ALIMTALK",
            content: renderedContent,
            status: "PENDING",
          },
        });

        // Send alimtalk
        const solapiTemplateId =
          process.env.SOLAPI_AUTO_REPLY_TEMPLATE_ID || autoReplyTemplate.id;

        const result = await sendAlimtalk({
          to: lead.phone,
          templateId: solapiTemplateId,
          variables: templateVariables,
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

        // Record AUTO_REPLY_SENT activity
        await prisma.activity.create({
          data: {
            leadId: lead.id,
            type: "AUTO_REPLY_SENT",
            content: result.success
              ? `자동 응답이 발송되었습니다.`
              : `자동 응답 발송에 실패했습니다: ${result.error}`,
            metadata: JSON.parse(
              JSON.stringify({
                messageId: messageRecord.id,
                solapiMsgId: result.messageId,
                success: result.success,
              })
            ),
          },
        });
      } else {
        console.warn(`No active AUTO_REPLY template found for business ${businessId}`);
      }
    } catch (autoReplyError) {
      console.error("Auto-reply step failed:", autoReplyError);
    }

    // --- Step g-i: Slack notification ---
    try {
      const webhookUrl = business.slackWebhook || "";
      const slackSent = await sendSlackNotification({
        webhookUrl,
        leadName: lead.name,
        leadPhone: lead.phone,
        desiredDate: lead.desiredDate?.toISOString() || null,
        guestCount: lead.guestCount,
        leadId: lead.id,
      });

      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "STAFF_NOTIFIED",
          content: slackSent
            ? "담당자에게 Slack 알림이 발송되었습니다."
            : "Slack 알림 발송에 실패했습니다.",
          metadata: JSON.parse(
            JSON.stringify({ channel: "slack", success: slackSent })
          ),
        },
      });
    } catch (slackError) {
      console.error("Slack notification step failed:", slackError);
    }

    // --- Step j-l: Initialize followup sequence ---
    try {
      const sequence = await prisma.followupSequence.findFirst({
        where: {
          businessId,
          isActive: true,
        },
      });

      if (sequence) {
        const steps = sequence.steps as unknown as FollowupStep[];

        if (steps.length > 0) {
          const firstStep = steps[0];
          const nextFollowupAt = new Date();
          nextFollowupAt.setDate(nextFollowupAt.getDate() + firstStep.delayDays);

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              sequenceActive: true,
              nextFollowupAt,
              currentSequenceStep: 0,
            },
          });
        }
      }
    } catch (sequenceError) {
      console.error("Followup sequence initialization failed:", sequenceError);
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("Inquiry webhook error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
