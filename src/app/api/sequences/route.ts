import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Helper to authenticate and get the current business.
 */
async function getAuthenticatedBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { email: user.email ?? "" },
  });

  return business;
}

/**
 * GET /api/sequences — List all followup sequences for the current business
 */
export async function GET() {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sequences = await prisma.followupSequence.findMany({
      where: { businessId: business.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ sequences });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sequences — Create a new followup sequence
 */
export async function POST(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, steps, isActive } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "이름과 단계 목록은 필수입니다." },
        { status: 400 }
      );
    }

    // If setting this as active, deactivate others first
    if (isActive) {
      await prisma.followupSequence.updateMany({
        where: { businessId: business.id, isActive: true },
        data: { isActive: false },
      });
    }

    const sequence = await prisma.followupSequence.create({
      data: {
        businessId: business.id,
        name,
        steps: JSON.parse(JSON.stringify(steps)),
        isActive: isActive ?? false,
      },
    });

    return NextResponse.json({ sequence }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sequences — Update an existing sequence
 */
export async function PATCH(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, steps, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "시퀀스 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify sequence belongs to business
    const existing = await prisma.followupSequence.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "시퀀스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // If activating, deactivate others first
    if (isActive === true) {
      await prisma.followupSequence.updateMany({
        where: { businessId: business.id, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const sequence = await prisma.followupSequence.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(steps !== undefined && { steps: JSON.parse(JSON.stringify(steps)) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ sequence });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sequences — Delete a sequence
 */
export async function DELETE(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "시퀀스 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify sequence belongs to business
    const existing = await prisma.followupSequence.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "시퀀스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await prisma.followupSequence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
