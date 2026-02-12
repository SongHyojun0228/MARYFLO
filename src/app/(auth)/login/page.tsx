"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError("로그인 링크 발송에 실패했습니다. 다시 시도해주세요.");
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
            메일을 확인해주세요
          </h2>
          <p className="mt-3 text-sm text-[#6B7280]">
            <span className="font-medium text-[#1B1B1B]">{email}</span>
            로 로그인 링크를 보냈습니다.
          </p>
          <p className="mt-4 text-xs text-[#6B7280]">
            메일이 안 보이면 스팸함을 확인해주세요.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="mt-6 text-sm font-medium text-[#A8D5BA] hover:text-[#8EC5A4]"
          >
            다른 이메일로 시도
          </button>
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
        <h1 className="mt-4 text-xl font-semibold text-[#1B1B1B]">로그인</h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">
          이메일을 입력하면 로그인 링크를 보내드립니다.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-[#6B7280]">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="h-12 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#A8D5BA]"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[#A8D5BA] text-sm font-medium text-white hover:bg-[#8EC5A4]"
          disabled={loading}
        >
          {loading ? "발송 중..." : "로그인 링크 받기"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#6B7280]">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-[#A8D5BA] hover:text-[#8EC5A4]">
          업체 등록하기
        </Link>
      </p>
    </div>
  );
}
