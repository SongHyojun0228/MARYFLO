import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getEventsForDate, getEventsForMonth } from "@/lib/google-calendar";

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
      select: { googleCalendarId: true },
    });

    if (!business?.googleCalendarId) {
      return NextResponse.json({
        configured: false,
        message: "Google Calendar가 설정되지 않았습니다.",
        events: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Single date check: /api/calendar?date=2025-03-15
    if (date) {
      const result = await getEventsForDate(business.googleCalendarId, date);
      return NextResponse.json({ configured: true, ...result });
    }

    // Month view: /api/calendar?year=2025&month=3
    if (year && month) {
      const events = await getEventsForMonth(
        business.googleCalendarId,
        parseInt(year),
        parseInt(month) - 1
      );
      return NextResponse.json({ configured: true, events });
    }

    return NextResponse.json(
      { error: "date 또는 year+month 파라미터가 필요합니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Calendar API error:", err);
    return NextResponse.json(
      { error: "캘린더 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
