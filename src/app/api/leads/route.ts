import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendSlackNotification } from "@/lib/slack";

interface FollowupStep {
  delayDays: number;
  templateTrigger: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { email: user.email ?? "" },
    });

    if (!business) {
      return NextResponse.json({ leads: [], nextCursor: null });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { businessId: business.id };
    if (status) {
      where.status = status;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { assignedStaff: true },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = leads.length > limit;
    const result = hasMore ? leads.slice(0, limit) : leads;
    const nextCursor = hasMore ? result[result.length - 1].id : null;

    return NextResponse.json({ leads: result, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { email: user.email ?? "" },
      select: { id: true, slackWebhook: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "업체 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, source, message, desiredDate, guestCount, email, budgetRange, priority } = body;

    if (!name || !phone || !source || !message) {
      return NextResponse.json(
        { error: "이름, 연락처, 유입 경로, 문의 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const validSources = ["INSTAGRAM_DM", "KAKAO", "NAVER_FORM", "WEBSITE", "PHONE", "OTHER"] as const;
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { error: "유효하지 않은 유입 경로입니다." },
        { status: 400 }
      );
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
    const leadPriority = priority && validPriorities.includes(priority) ? priority : "MEDIUM";

    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        name,
        phone,
        email: email || null,
        source,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        guestCount: guestCount ? Number(guestCount) : null,
        budgetRange: budgetRange || null,
        rawInquiry: message,
        priority: leadPriority,
        status: "NEW",
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "INQUIRY_RECEIVED",
        content: `${name}님의 문의가 직접 등록되었습니다.`,
        metadata: JSON.parse(JSON.stringify({ source, registeredBy: user.email })),
      },
    });

    // Slack notification
    try {
      const webhookUrl = business.slackWebhook || process.env.SLACK_WEBHOOK_URL || "";
      await sendSlackNotification({
        webhookUrl,
        leadName: lead.name,
        leadPhone: lead.phone,
        desiredDate: lead.desiredDate?.toISOString() || null,
        guestCount: lead.guestCount,
        leadId: lead.id,
      });
    } catch (slackError) {
      console.error("Slack notification failed:", slackError);
    }

    // Initialize followup sequence
    try {
      const sequence = await prisma.followupSequence.findFirst({
        where: { businessId: business.id, isActive: true },
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
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
