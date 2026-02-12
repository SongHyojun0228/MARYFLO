import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAlimtalk } from "@/lib/solapi";
import { sendSlackNotification } from "@/lib/slack";

/**
 * GET /api/cron/report
 *
 * Weekly report cron — runs every Monday at 09:00 KST (Sun 00:00 UTC).
 * Aggregates past week's KPI for each business and notifies the owner
 * via alimtalk (or Slack as fallback).
 *
 * Authorization: Bearer CRON_SECRET header required.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = {
    businessesProcessed: 0,
    notificationsSent: 0,
    errors: [] as string[],
  };

  try {
    // Calculate last week range (Mon 00:00 ~ Sun 23:59 KST)
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(0, 0, 0, 0);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    // Fetch all active businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        slackWebhook: true,
      },
    });

    for (const biz of businesses) {
      try {
        // Aggregate weekly stats
        const [newLeads, contacted, quoteSent, contracted, lost] =
          await Promise.all([
            prisma.lead.count({
              where: {
                businessId: biz.id,
                createdAt: { gte: weekStart, lt: weekEnd },
              },
            }),
            prisma.lead.count({
              where: {
                businessId: biz.id,
                status: "CONTACTED",
                updatedAt: { gte: weekStart, lt: weekEnd },
              },
            }),
            prisma.lead.count({
              where: {
                businessId: biz.id,
                status: "QUOTE_SENT",
                updatedAt: { gte: weekStart, lt: weekEnd },
              },
            }),
            prisma.lead.count({
              where: {
                businessId: biz.id,
                status: "CONTRACTED",
                updatedAt: { gte: weekStart, lt: weekEnd },
              },
            }),
            prisma.lead.count({
              where: {
                businessId: biz.id,
                status: "LOST",
                updatedAt: { gte: weekStart, lt: weekEnd },
              },
            }),
          ]);

        // Count active followups (leads with pending followup)
        const activeFollowups = await prisma.lead.count({
          where: {
            businessId: biz.id,
            sequenceActive: true,
            nextFollowupAt: { not: null },
          },
        });

        // Skip businesses with zero activity
        if (
          newLeads === 0 &&
          contacted === 0 &&
          quoteSent === 0 &&
          contracted === 0 &&
          lost === 0
        ) {
          continue;
        }

        summary.businessesProcessed++;

        const conversionRate =
          newLeads > 0 ? Math.round((contracted / newLeads) * 100) : 0;

        const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate() - 1}`;

        const reportText = [
          `[${biz.name}] 주간 리포트 (${weekLabel})`,
          ``,
          `신규 문의: ${newLeads}건`,
          `상담 전환: ${contacted}건`,
          `견적 발송: ${quoteSent}건`,
          `계약 완료: ${contracted}건 (${conversionRate}%)`,
          `이탈: ${lost}건`,
          ``,
          `팔로업 진행 중: ${activeFollowups}건`,
        ].join("\n");

        // Try sending via alimtalk to business phone
        const reportTemplateId =
          process.env.SOLAPI_WEEKLY_REPORT_TEMPLATE_ID || "";

        if (biz.phone && reportTemplateId) {
          const result = await sendAlimtalk({
            to: biz.phone,
            templateId: reportTemplateId,
            variables: {
              business_name: biz.name,
              week_label: weekLabel,
              new_leads: newLeads.toString(),
              contacted: contacted.toString(),
              quote_sent: quoteSent.toString(),
              contracted: contracted.toString(),
              conversion_rate: `${conversionRate}%`,
              lost: lost.toString(),
              active_followups: activeFollowups.toString(),
            },
          });

          if (result.success) {
            summary.notificationsSent++;
          } else {
            summary.errors.push(
              `Business ${biz.id}: alimtalk failed — ${result.error}`
            );
          }
        }

        // Always send Slack notification if configured
        if (biz.slackWebhook) {
          await sendSlackReport({
            webhookUrl: biz.slackWebhook,
            reportText,
            businessName: biz.name,
          });
          summary.notificationsSent++;
        }

        // Log in dev mode
        if (!biz.slackWebhook && !reportTemplateId) {
          console.log("[DEV MODE] Weekly report:\n", reportText);
          summary.notificationsSent++;
        }
      } catch (bizError) {
        const msg =
          bizError instanceof Error ? bizError.message : "Unknown error";
        summary.errors.push(`Business ${biz.id}: ${msg}`);
      }
    }

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error("Weekly report cron error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다.", summary },
      { status: 500 }
    );
  }
}

/**
 * Send a weekly report summary to Slack.
 */
async function sendSlackReport({
  webhookUrl,
  reportText,
  businessName,
}: {
  webhookUrl: string;
  reportText: string;
  businessName: string;
}) {
  const payload = {
    text: reportText,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📊 ${businessName} 주간 리포트`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: reportText,
        },
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Slack report notification error:", error);
  }
}
