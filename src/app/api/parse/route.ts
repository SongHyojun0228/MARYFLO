import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseInquiry } from "@/lib/openai";

/**
 * POST /api/parse
 *
 * Independent AI parsing endpoint.
 * Accepts raw inquiry text and returns structured parsed data.
 * Authenticated — requires logged-in user.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "파싱할 텍스트를 입력해주세요." },
        { status: 400 }
      );
    }

    const parsed = await parseInquiry(text.trim());

    return NextResponse.json({ success: true, parsed });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
