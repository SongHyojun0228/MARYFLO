import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/dashboard/CalendarView";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await prisma.business.findFirst({
    where: { email: user?.email ?? "" },
  });

  // Get all leads with desiredDate for calendar display
  const leads = business
    ? await prisma.lead.findMany({
        where: {
          businessId: business.id,
          desiredDate: { not: null },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          desiredDate: true,
          guestCount: true,
          status: true,
        },
        orderBy: { desiredDate: "asc" },
      })
    : [];

  const calendarLeads = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    desiredDate: lead.desiredDate!.toISOString(),
    guestCount: lead.guestCount,
    status: lead.status,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">일정</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          희망 날짜별 문의 현황을 확인하세요.
        </p>
      </div>

      <CalendarView leads={calendarLeads} />
    </div>
  );
}
