import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  MESSAGE_TYPE_LABELS,
  MESSAGE_STATUS_LABELS,
} from "@/lib/constants";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await prisma.business.findFirst({
    where: { email: user?.email ?? "" },
  });

  const messages = business
    ? await prisma.message.findMany({
        where: { lead: { businessId: business.id } },
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { name: true, phone: true } } },
      })
    : [];

  const statusCounts = {
    ALL: messages.length,
    PENDING: messages.filter((m) => m.status === "PENDING").length,
    SENT: messages.filter((m) => m.status === "SENT").length,
    DELIVERED: messages.filter((m) => m.status === "DELIVERED").length,
    FAILED: messages.filter((m) => m.status === "FAILED").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">메시지 이력</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          발송된 알림톡 및 메시지 내역을 확인하세요.
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([key, count]) => {
          const label =
            key === "ALL"
              ? "전체"
              : (MESSAGE_STATUS_LABELS[key] ?? key);
          return (
            <span
              key={key}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] shadow-sm"
            >
              {label}{" "}
              <span className="font-semibold text-[#1B1B1B]">{count}</span>
            </span>
          );
        })}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-lg">
          <p className="text-lg font-medium text-gray-400">
            아직 발송된 메시지가 없습니다
          </p>
          <p className="mt-2 text-sm text-gray-400">
            문의가 접수되면 자동으로 알림톡이 발송됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Table header */}
          <div className="hidden border-b border-gray-100 px-5 py-3 text-xs font-medium text-[#6B7280] sm:grid sm:grid-cols-12">
            <div className="col-span-2">수신자</div>
            <div className="col-span-4">내용</div>
            <div className="col-span-2">유형</div>
            <div className="col-span-2">상태</div>
            <div className="col-span-2">발송 시각</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="px-4 py-3 text-sm sm:grid sm:grid-cols-12 sm:items-center sm:px-5"
              >
                {/* Mobile: card layout */}
                <div className="col-span-2">
                  <p className="font-medium text-[#1B1B1B]">
                    {msg.lead.name}
                  </p>
                  <p className="text-xs text-[#6B7280] sm:hidden">
                    {msg.lead.phone}
                  </p>
                </div>
                <div className="col-span-4 mt-1 sm:mt-0">
                  <p className="line-clamp-2 text-[#6B7280] sm:truncate sm:line-clamp-none">{msg.content}</p>
                </div>
                <div className="col-span-2 mt-1 sm:mt-0">
                  <span className="text-xs text-[#6B7280]">
                    {MESSAGE_TYPE_LABELS[msg.type] ?? msg.type}
                  </span>
                </div>
                <div className="col-span-2 mt-1 flex items-center gap-2 sm:mt-0">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={getStatusStyle(msg.status)}
                  >
                    {MESSAGE_STATUS_LABELS[msg.status] ?? msg.status}
                  </span>
                  <span className="text-xs text-[#6B7280] sm:hidden">
                    {formatDateTime(msg.sentAt ?? msg.createdAt)}
                  </span>
                </div>
                <div className="col-span-2 mt-1 hidden text-xs text-[#6B7280] sm:mt-0 sm:block">
                  {formatDateTime(msg.sentAt ?? msg.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function getStatusStyle(status: string): React.CSSProperties {
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
