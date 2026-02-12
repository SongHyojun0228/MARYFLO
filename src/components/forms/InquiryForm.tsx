"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InquiryFormProps {
  businessId: string;
}

export function InquiryForm({ businessId }: InquiryFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    desiredDate: "",
    guestCount: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/webhooks/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        name: form.name,
        phone: form.phone,
        desiredDate: form.desiredDate || undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        message: form.message,
        source: "WEBSITE",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "문의 접수에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
        <div className="mb-4 text-5xl">💐</div>
        <h2 className="text-xl font-semibold text-[#1B1B1B]">
          문의가 접수되었습니다!
        </h2>
        <p className="mt-3 text-sm text-[#6B7280]">
          담당 플래너가 곧 연락드릴게요.
          <br />
          빠른 시간 내에 확인 후 안내드리겠습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-[#6B7280]">이름 *</Label>
          <Input
            id="name"
            type="text"
            placeholder="홍길동"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            autoFocus
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm text-[#6B7280]">연락처 *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            required
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="desiredDate" className="text-sm text-[#6B7280]">희망 날짜</Label>
            <Input
              id="desiredDate"
              type="date"
              value={form.desiredDate}
              onChange={(e) => updateField("desiredDate", e.target.value)}
              className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guestCount" className="text-sm text-[#6B7280]">예상 인원</Label>
            <Input
              id="guestCount"
              type="number"
              placeholder="150"
              min={1}
              value={form.guestCount}
              onChange={(e) => updateField("guestCount", e.target.value)}
              className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm text-[#6B7280]">문의 내용 *</Label>
          <textarea
            id="message"
            className="flex min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm placeholder:text-[#6B7280]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A8D5BA]"
            placeholder="궁금한 점이나 요청사항을 자유롭게 적어주세요."
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[#A8D5BA] text-sm font-medium text-white hover:bg-[#8EC5A4]"
          disabled={loading}
        >
          {loading ? "접수 중..." : "문의하기"}
        </Button>
      </form>
    </div>
  );
}
