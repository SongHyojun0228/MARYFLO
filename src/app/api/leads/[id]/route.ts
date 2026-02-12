import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const business = await prisma.business.findFirst({
      where: { email: user.email ?? "" },
    });

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, businessId: business.id },
      include: {
        assignedStaff: true,
        activities: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the lead belongs to user's business
    const business = await prisma.business.findFirst({
      where: { email: user.email ?? "" },
    });

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, businessId: business.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: body,
    });

    // Record status change activity
    if (body.status && body.status !== lead.status) {
      await prisma.activity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGED",
          content: `상태 변경: ${lead.status} → ${body.status}`,
        },
      });
    }

    return NextResponse.json({ lead: updated });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
