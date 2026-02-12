import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/constants";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await prisma.business.findFirst({
    where: { email: user?.email ?? "" },
  });

  const businessId = business?.id;

  // Date ranges
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Weekly stats
  const [weekNew, weekContacted, weekQuote, weekContracted, weekLost] =
    businessId
      ? await Promise.all([
          prisma.lead.count({
            where: { businessId, createdAt: { gte: weekStart } },
          }),
          prisma.lead.count({
            where: {
              businessId,
              status: "CONTACTED",
              updatedAt: { gte: weekStart },
            },
          }),
          prisma.lead.count({
            where: {
              businessId,
              status: "QUOTE_SENT",
              updatedAt: { gte: weekStart },
            },
          }),
          prisma.lead.count({
            where: {
              businessId,
              status: "CONTRACTED",
              updatedAt: { gte: weekStart },
            },
          }),
          prisma.lead.count({
            where: {
              businessId,
              status: "LOST",
              updatedAt: { gte: weekStart },
            },
          }),
        ])
      : [0, 0, 0, 0, 0];

  // Monthly stats
  const [monthNew, monthContracted, monthLost] = businessId
    ? await Promise.all([
        prisma.lead.count({
          where: { businessId, createdAt: { gte: monthStart } },
        }),
        prisma.lead.count({
          where: {
            businessId,
            status: "CONTRACTED",
            updatedAt: { gte: monthStart },
          },
        }),
        prisma.lead.count({
          where: {
            businessId,
            status: "LOST",
            updatedAt: { gte: monthStart },
          },
        }),
      ])
    : [0, 0, 0];

  const monthConversionRate =
    monthNew > 0 ? Math.round((monthContracted / monthNew) * 100) : 0;

  // Source distribution (all time for this business)
  const sourceGroups = businessId
    ? await prisma.lead.groupBy({
        by: ["source"],
        where: { businessId },
        _count: true,
        orderBy: { _count: { source: "desc" } },
      })
    : [];

  // Status distribution
  const statusGroups = businessId
    ? await prisma.lead.groupBy({
        by: ["status"],
        where: { businessId },
        _count: true,
        orderBy: { _count: { status: "desc" } },
      })
    : [];

  // Recent contracts
  const recentContracts = businessId
    ? await prisma.lead.findMany({
        where: { businessId, status: "CONTRACTED" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          desiredDate: true,
          guestCount: true,
          updatedAt: true,
        },
      })
    : [];

  const weeklyKpi = [
    { label: "신규 문의", value: weekNew, color: "#A8D5BA" },
    { label: "상담 전환", value: weekContacted, color: "#6B7280" },
    { label: "견적 발송", value: weekQuote, color: "#1B1B1B" },
    { label: "계약 완료", value: weekContracted, color: "#D4AF37" },
    { label: "이탈", value: weekLost, color: "#C62828" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">리포트</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          문의 현황과 전환 성과를 확인하세요.
        </p>
      </div>

      {/* Weekly KPI */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#6B7280]">
          이번 주 현황
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {weeklyKpi.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl bg-white p-4 shadow-lg"
            >
              <p className="text-sm text-[#6B7280]">{kpi.label}</p>
              <p
                className="mt-1 text-2xl font-semibold"
                style={{ color: kpi.color }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#6B7280]">
          이번 달 요약
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="신규 문의" value={`${monthNew}건`} />
          <SummaryCard label="계약 완료" value={`${monthContracted}건`} accent />
          <SummaryCard label="이탈" value={`${monthLost}건`} />
          <SummaryCard label="전환율" value={`${monthConversionRate}%`} accent />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Distribution */}
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
            유입 경로별 분포
          </h2>
          {sourceGroups.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              데이터가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {sourceGroups.map((group) => {
                const total = sourceGroups.reduce(
                  (sum, g) => sum + g._count,
                  0
                );
                const pct =
                  total > 0
                    ? Math.round((group._count / total) * 100)
                    : 0;
                return (
                  <div key={group.source}>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">
                        {LEAD_SOURCE_LABELS[group.source] ?? group.source}
                      </span>
                      <span className="font-medium text-[#1B1B1B]">
                        {group._count}건 ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#FAF9F6]">
                      <div
                        className="h-full rounded-full bg-[#A8D5BA]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
            상태별 분포
          </h2>
          {statusGroups.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              데이터가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {statusGroups.map((group) => {
                const total = statusGroups.reduce(
                  (sum, g) => sum + g._count,
                  0
                );
                const pct =
                  total > 0
                    ? Math.round((group._count / total) * 100)
                    : 0;
                return (
                  <div key={group.status}>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">
                        {LEAD_STATUS_LABELS[group.status] ?? group.status}
                      </span>
                      <span className="font-medium text-[#1B1B1B]">
                        {group._count}건 ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#FAF9F6]">
                      <div
                        className="h-full rounded-full bg-[#D4AF37]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Contracts */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
          최근 계약
        </h2>
        {recentContracts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">
            아직 계약 건이 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentContracts.map((lead) => (
              <a
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-[#FAF9F6]"
              >
                <div>
                  <p className="text-sm font-medium text-[#1B1B1B]">
                    {lead.name}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {lead.phone}
                    {lead.desiredDate &&
                      ` · ${lead.desiredDate.toLocaleDateString("ko-KR")}`}
                    {lead.guestCount && ` · ${lead.guestCount}명`}
                  </p>
                </div>
                <span className="text-xs text-[#6B7280]">
                  {lead.updatedAt.toLocaleDateString("ko-KR")}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p
        className="mt-1 text-2xl font-semibold"
        style={{ color: accent ? "#D4AF37" : "#1B1B1B" }}
      >
        {value}
      </p>
    </div>
  );
}
