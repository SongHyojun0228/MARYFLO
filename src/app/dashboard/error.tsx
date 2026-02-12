"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-lg font-semibold text-[#1B1B1B]">
          문제가 발생했습니다
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          {error.message || "데이터를 불러오는 중 오류가 발생했습니다."}
        </p>
        <Button
          onClick={reset}
          className="mt-4 bg-[#1B1B1B] text-white hover:bg-[#333]"
        >
          다시 시도
        </Button>
      </div>
    </div>
  );
}
