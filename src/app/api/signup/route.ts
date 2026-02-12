import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BusinessType } from "../../../types";

interface SignupBody {
  email: string;
  businessName: string;
  businessType: string;
  phone: string;
}

export async function POST(request: Request) {
  try {
    const body: SignupBody = await request.json();
    const { email, businessName, businessType, phone } = body;

    if (!email || !businessName || !businessType || !phone) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // Validate business type
    const validTypes = Object.values(BusinessType);
    if (!validTypes.includes(businessType as BusinessType)) {
      return NextResponse.json(
        { error: "올바른 업종을 선택해주세요." },
        { status: 400 }
      );
    }

    // Send magic link via Supabase Auth
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard`,
        data: {
          business_name: businessName,
          business_type: businessType,
          phone,
        },
      },
    });

    if (authError) {
      console.error("Supabase auth error:", authError.message, authError.status);
      return NextResponse.json(
        { error: `회원가입에 실패했습니다: ${authError.message}` },
        { status: 500 }
      );
    }

    // Create business record
    // The user might not exist in Supabase yet (magic link not clicked),
    // so we create the business linked by email for now
    const existingBusiness = await prisma.business.findFirst({
      where: { email },
    });

    if (!existingBusiness) {
      await prisma.business.create({
        data: {
          name: businessName,
          type: businessType as BusinessType,
          phone,
          email,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
