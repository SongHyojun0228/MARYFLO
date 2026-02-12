import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find existing business or report error
  const business = await prisma.business.findFirst();

  if (!business) {
    console.error("❌ Business가 없습니다. 먼저 회원가입으로 업체를 등록하세요.");
    process.exit(1);
  }

  console.log(`✅ Business found: ${business.name} (${business.id})`);

  // Upsert AUTO_REPLY template
  const existingTemplate = await prisma.messageTemplate.findFirst({
    where: { businessId: business.id, trigger: "AUTO_REPLY" },
  });

  if (existingTemplate) {
    console.log(`ℹ️  AUTO_REPLY template already exists (${existingTemplate.id}), skipping`);
  } else {
    const template = await prisma.messageTemplate.create({
      data: {
        businessId: business.id,
        name: "자동 응답 (신규 문의)",
        trigger: "AUTO_REPLY",
        content:
          "{{name}}님, {{business_name}}에 문의해주셔서 감사합니다! 빠른 시일 내에 담당자가 연락드리겠습니다.",
        isActive: true,
      },
    });
    console.log(`✅ AUTO_REPLY template created (${template.id})`);
  }

  // Upsert followup sequence
  const existingSequence = await prisma.followupSequence.findFirst({
    where: { businessId: business.id, isActive: true },
  });

  if (existingSequence) {
    console.log(`ℹ️  FollowupSequence already exists (${existingSequence.id}), skipping`);
  } else {
    const sequence = await prisma.followupSequence.create({
      data: {
        businessId: business.id,
        name: "기본 팔로업 시퀀스",
        steps: [
          { delayDays: 3, templateTrigger: "FOLLOWUP_D3" },
          { delayDays: 7, templateTrigger: "FOLLOWUP_D7" },
          { delayDays: 14, templateTrigger: "FOLLOWUP_D14" },
        ],
        isActive: true,
      },
    });
    console.log(`✅ FollowupSequence created (${sequence.id})`);
  }

  // Create followup templates if missing
  const followupTemplates = [
    {
      trigger: "FOLLOWUP_D3" as const,
      name: "3일 후 팔로업",
      content:
        "{{name}}님, {{business_name}}입니다. 혹시 추가로 궁금하신 점이 있으실까요? 편하게 연락주세요!",
    },
    {
      trigger: "FOLLOWUP_D7" as const,
      name: "7일 후 팔로업",
      content:
        "{{name}}님, {{business_name}}입니다. 웨딩 준비는 잘 진행되고 계신가요? 방문 상담도 가능하니 말씀해주세요.",
    },
    {
      trigger: "FOLLOWUP_D14" as const,
      name: "14일 후 팔로업",
      content:
        "{{name}}님, {{business_name}}입니다. 아직 고민 중이시라면 최신 견적을 보내드릴까요? 언제든 문의해주세요!",
    },
  ];

  for (const tmpl of followupTemplates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { businessId: business.id, trigger: tmpl.trigger },
    });

    if (existing) {
      console.log(`ℹ️  ${tmpl.trigger} template already exists, skipping`);
    } else {
      const created = await prisma.messageTemplate.create({
        data: {
          businessId: business.id,
          name: tmpl.name,
          trigger: tmpl.trigger,
          content: tmpl.content,
          isActive: true,
        },
      });
      console.log(`✅ ${tmpl.trigger} template created (${created.id})`);
    }
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
