import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "내용을 입력해주세요." },
        { status: 400 }
      );
    }

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

    const activity = await prisma.activity.create({
      data: {
        leadId: id,
        type: "NOTE_ADDED",
        content,
      },
    });

    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
