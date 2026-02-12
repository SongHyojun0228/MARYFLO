import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { QuickLeadDialog } from "@/components/dashboard/QuickLeadDialog";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await prisma.business.findFirst({
    where: { email: user?.email ?? "" },
  });

  const businessId = business?.id;

  // Query lead stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [newToday, inConsultation, quotesSent, monthlyContracts] =
    businessId
      ? await Promise.all([
          prisma.lead.count({
            where: { businessId, createdAt: { gte: today } },
          }),
          prisma.lead.count({
            where: { businessId, status: "CONTACTED" },
          }),
          prisma.lead.count({
            where: { businessId, status: "QUOTE_SENT" },
          }),
          prisma.lead.count({
            where: {
              businessId,
              status: "CONTRACTED",
              updatedAt: { gte: monthStart },
            },
          }),
        ])
      : [0, 0, 0, 0];

  const stats = [
    { title: "오늘 신규 문의", value: newToday, accent: false },
    { title: "상담 중", value: inConsultation, accent: false },
    { title: "견적 발송", value: quotesSent, accent: false },
    { title: "이번 달 계약", value: monthlyContracts, accent: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1B1B]">
            {business ? `${business.name}` : "대시보드"}
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            오늘의 문의 현황을 한눈에 확인하세요.
          </p>
        </div>
        <QuickLeadDialog
          trigger={
            <Button className="w-full bg-[#1B1B1B] text-white hover:bg-[#2C2C2C] sm:w-auto">
              + 문의 직접 등록
            </Button>
          }
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl bg-white p-5 shadow-lg transition-shadow hover:shadow-xl"
          >
            <p className="text-sm text-[#6B7280]">{stat.title}</p>
            <p
              className="mt-1 text-3xl font-semibold"
              style={{ color: stat.accent ? "#D4AF37" : "#1B1B1B" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Onboarding checklist */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-[#1B1B1B]">
          시작하기
        </h2>
        <div className="space-y-3 text-sm text-[#6B7280]">
          <CheckItem done={!!business} label="업체 등록 완료" />
          <CheckItem
            done={!!business?.solapiApiKey}
            label="알림톡 API 키 설정 (설정 > API 연동)"
          />
          <CheckItem done={false} label="메시지 템플릿 등록" />
          <CheckItem done={false} label="자동 팔로업 시퀀스 설정" />
          <CheckItem done={false} label="문의 폼 링크를 웹사이트에 추가" />
        </div>
      </div>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={
          done
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#A8D5BA] text-[10px] text-white"
            : "h-5 w-5 rounded-full border-2 border-gray-200"
        }
      >
        {done && "✓"}
      </div>
      <span className={done ? "text-[#1B1B1B]" : ""}>{label}</span>
    </div>
  );
}
