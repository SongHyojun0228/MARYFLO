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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        phone: business.phone,
        email: business.email,
        solapiApiKey: business.solapiApiKey ? "••••••••" : null,
        solapiSecret: business.solapiSecret ? "••••••••" : null,
        slackWebhook: business.slackWebhook ?? "",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ["solapiApiKey", "solapiSecret", "slackWebhook"] as const;
    const data: Record<string, string> = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === "string") {
        data[field] = body[field];
      }
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data,
    });

    return NextResponse.json({
      business: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        phone: updated.phone,
        email: updated.email,
        solapiApiKey: updated.solapiApiKey ? "••••••••" : null,
        solapiSecret: updated.solapiSecret ? "••••••••" : null,
        slackWebhook: updated.slackWebhook ?? "",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
