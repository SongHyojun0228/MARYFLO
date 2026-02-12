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
 * GET /api/templates — List all templates for the current business
 */
export async function GET() {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.messageTemplate.findMany({
      where: { businessId: business.id },
      orderBy: { trigger: "asc" },
    });

    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates — Create a new template
 */
export async function POST(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, trigger, content, isActive } = body;

    if (!name || !trigger || !content) {
      return NextResponse.json(
        { error: "이름, 트리거, 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        businessId: business.id,
        name,
        trigger,
        content,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates — Update an existing template
 */
export async function PATCH(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, trigger, content, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "템플릿 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify template belongs to business
    const existing = await prisma.messageTemplate.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(trigger !== undefined && { trigger }),
        ...(content !== undefined && { content }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates — Delete a template
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
        { error: "템플릿 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify template belongs to business
    const existing = await prisma.messageTemplate.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await prisma.messageTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
