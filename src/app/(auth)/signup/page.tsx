"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    businessName: "",
    businessType: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "등록에 실패했습니다.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg sm:p-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#1B1B1B]">
            등록 완료!
          </h2>
          <p className="mt-3 text-sm text-[#6B7280]">
            <span className="font-medium text-[#1B1B1B]">{form.email}</span>
            <br />
            로 로그인 링크를 보냈습니다.
          </p>
          <p className="mt-4 text-xs text-[#6B7280]">
            메일함에서 링크를 클릭하면 대시보드로 이동합니다.
            <br />
            메일이 안 보이면 스팸함을 확인해주세요.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-[#A8D5BA] hover:text-[#8EC5A4]"
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg sm:p-10">
      <div className="mb-8 text-center">
        <Link href="/" className="font-logo inline-block text-lg text-[#1B1B1B]">
          MARIFLO
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-[#1B1B1B]">업체 등록</h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">
          업체 정보를 입력하고 마리플로를 시작하세요.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm text-[#6B7280]">업체명</Label>
          <Input
            id="businessName"
            type="text"
            placeholder="예) 더채플 강남"
            value={form.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            required
            autoFocus
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType" className="text-sm text-[#6B7280]">업종</Label>
          <Select
            value={form.businessType}
            onValueChange={(value) => updateField("businessType", value)}
            required
          >
            <SelectTrigger
              id="businessType"
              className="h-12 w-full rounded-xl border-gray-200 bg-white text-sm focus:ring-[#A8D5BA]"
            >
              <SelectValue placeholder="업종을 선택해주세요" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm text-[#6B7280]">연락처</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="02-1234-5678"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            required
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-[#6B7280]">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
          <p className="text-xs text-[#6B7280]">
            이 이메일로 로그인 링크가 발송됩니다.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[#A8D5BA] text-sm font-medium text-white hover:bg-[#8EC5A4]"
          disabled={loading || !form.businessType}
        >
          {loading ? "등록 중..." : "업체 등록하기"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#6B7280]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-[#A8D5BA] hover:text-[#8EC5A4]">
          로그인
        </Link>
      </p>
    </div>
  );
}
