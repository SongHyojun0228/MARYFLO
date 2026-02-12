import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  PRIORITY_LABELS,
  ACTIVITY_TYPE_LABELS,
  MESSAGE_TYPE_LABELS,
  MESSAGE_STATUS_LABELS,
} from "@/lib/constants";
import { LeadDetailClient } from "@/components/dashboard/LeadDetailClient";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const business = await prisma.business.findFirst({
    where: { email: user.email ?? "" },
  });

  if (!business) notFound();

  const lead = await prisma.lead.findFirst({
    where: { id, businessId: business.id },
    include: {
      assignedStaff: true,
      activities: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const activities = lead.activities.map((a) => ({
    id: a.id,
    type: a.type,
    typeLabel: ACTIVITY_TYPE_LABELS[a.type] ?? a.type,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
  }));

  const messages = lead.messages.map((m) => ({
    id: m.id,
    type: m.type,
    typeLabel: MESSAGE_TYPE_LABELS[m.type] ?? m.type,
    content: m.content,
    status: m.status,
    statusLabel: MESSAGE_STATUS_LABELS[m.status] ?? m.status,
    sentAt: m.sentAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a
          href="/dashboard/leads"
          className="text-sm text-[#6B7280] hover:text-[#1B1B1B]"
        >
          &larr; 문의 고객 목록
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">
          {lead.name}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info + Status Control */}
        <div className="space-y-4 lg:col-span-1">
          {/* Customer Info Card */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold text-[#1B1B1B]">
              고객 정보
            </h2>
            <dl className="space-y-2 text-sm">
              <InfoRow label="연락처" value={lead.phone} />
              {lead.email && <InfoRow label="이메일" value={lead.email} />}
              <InfoRow
                label="유입 경로"
                value={LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
              />
              {lead.desiredDate && (
                <InfoRow
                  label="희망 날짜"
                  value={lead.desiredDate.toLocaleDateString("ko-KR")}
                />
              )}
              {lead.guestCount && (
                <InfoRow label="예상 인원" value={`${lead.guestCount}명`} />
              )}
              {lead.budgetRange && (
                <InfoRow label="예산" value={lead.budgetRange} />
              )}
              <InfoRow
                label="우선순위"
                value={PRIORITY_LABELS[lead.priority] ?? lead.priority}
              />
              {lead.assignedStaff && (
                <InfoRow label="담당자" value={lead.assignedStaff.name} />
              )}
            </dl>
          </div>

          {/* Status Change + Note - Client Component */}
          <LeadDetailClient
            leadId={lead.id}
            currentStatus={lead.status}
            statusLabels={LEAD_STATUS_LABELS}
          />

          {/* Raw Inquiry */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold text-[#1B1B1B]">
              원본 문의 내용
            </h2>
            <p className="whitespace-pre-wrap text-sm text-[#6B7280]">
              {lead.rawInquiry}
            </p>
          </div>
        </div>

        {/* Right: Timeline + Messages */}
        <div className="space-y-4 lg:col-span-2">
          {/* Activity Timeline */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
              활동 타임라인
            </h2>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B7280]">
                아직 활동 이력이 없습니다.
              </p>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="relative flex gap-3 pb-6">
                    {/* Vertical line */}
                    {i < activities.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-full w-px bg-gray-200" />
                    )}
                    {/* Dot */}
                    <div
                      className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full"
                      style={{
                        backgroundColor: getActivityColor(activity.type),
                      }}
                    />
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-[#1B1B1B]">
                          {activity.typeLabel}
                        </span>
                        <span className="shrink-0 text-xs text-[#6B7280]">
                          {formatDateTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#6B7280]">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
              발송 메시지
            </h2>
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B7280]">
                아직 발송된 메시지가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#6B7280]">
                        {msg.typeLabel}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={getMessageStatusStyle(msg.status)}
                      >
                        {msg.statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#1B1B1B]">
                      {msg.content}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {msg.sentAt
                        ? formatDateTime(msg.sentAt)
                        : formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="flex-shrink-0 text-[#6B7280]">{label}</dt>
      <dd className="truncate text-right font-medium text-[#1B1B1B]">{value}</dd>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    INQUIRY_RECEIVED: "#A8D5BA",
    AUTO_REPLY_SENT: "#66BB6A",
    STAFF_NOTIFIED: "#6B7280",
    CALL_MADE: "#1B1B1B",
    QUOTE_SENT: "#D4AF37",
    FOLLOWUP_SENT: "#8EC5A4",
    VISIT_SCHEDULED: "#D4AF37",
    STATUS_CHANGED: "#6B7280",
    NOTE_ADDED: "#9E9E9E",
  };
  return colors[type] ?? "#6B7280";
}

function getMessageStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "DELIVERED":
      return { backgroundColor: "#E8F5E9", color: "#2E7D32" };
    case "SENT":
      return { backgroundColor: "#E3F2FD", color: "#1565C0" };
    case "FAILED":
      return { backgroundColor: "#FFEBEE", color: "#C62828" };
    default:
      return { backgroundColor: "#F5F5F5", color: "#6B7280" };
  }
}
