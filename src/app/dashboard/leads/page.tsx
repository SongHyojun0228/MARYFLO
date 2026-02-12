import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LeadKanban, type LeadItem } from "@/components/dashboard/LeadKanban";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await prisma.business.findFirst({
    where: { email: user?.email ?? "" },
  });

  let leads: LeadItem[] = [];

  if (business) {
    const dbLeads = await prisma.lead.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: { assignedStaff: { select: { name: true } } },
    });

    leads = dbLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      status: lead.status,
      desiredDate: lead.desiredDate?.toISOString() ?? null,
      guestCount: lead.guestCount,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      assignedStaff: lead.assignedStaff,
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1B1B]">문의 고객</h1>
          <p className="mt-1 text-sm text-gray-500">
            드래그하여 상태를 변경할 수 있습니다.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          총 <span className="font-semibold text-[#1B1B1B]">{leads.length}</span>건
        </div>
      </div>

      <LeadKanban initialLeads={leads} />

      {leads.length === 0 && (
        <div className="rounded-xl border bg-white py-16 text-center">
          <p className="text-lg font-medium text-gray-400">
            아직 문의 고객이 없습니다
          </p>
          <p className="mt-2 text-sm text-gray-400">
            문의 폼을 통해 고객이 들어오면 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
