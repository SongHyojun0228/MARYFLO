import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { RealtimeListener } from "@/components/dashboard/RealtimeListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const business = await prisma.business.findFirst({
    where: { email: user.email ?? "" },
  });

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        userEmail={user.email ?? ""}
        businessName={business?.name ?? null}
      />
      <main className="flex-1 overflow-auto bg-[#FAF9F6] p-4 pb-20 sm:p-6 sm:pb-6 lg:p-8">
        {children}
      </main>
      {business && <RealtimeListener businessId={business.id} />}
    </div>
  );
}
