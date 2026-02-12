import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      return NextResponse.json({ leads: [] });
    }

    const leads = await prisma.lead.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: { assignedStaff: true },
    });

    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
