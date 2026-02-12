import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/InquiryForm";

export default async function InquiryPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, type: true },
  });

  if (!business) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#FAF9F6] px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="font-logo mb-1 text-sm text-[#1B1B1B]">
            MARIFLO
          </p>
          <h1 className="text-2xl font-semibold text-[#1B1B1B]">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            문의를 남겨주시면 담당 플래너가 빠르게 연락드립니다.
          </p>
        </div>

        <InquiryForm businessId={business.id} />
      </div>
    </div>
  );
}
