"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";

const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS);

export function QuickLeadDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("PHONE");
  const [desiredDate, setDesiredDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [email, setEmail] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [message, setMessage] = useState("");

  function resetForm() {
    setName("");
    setPhone("");
    setSource("PHONE");
    setDesiredDate("");
    setGuestCount("");
    setEmail("");
    setBudgetRange("");
    setMessage("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("이름, 연락처, 문의 내용은 필수입니다.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          source,
          message: message.trim(),
          desiredDate: desiredDate || undefined,
          guestCount: guestCount ? Number(guestCount) : undefined,
          email: email.trim() || undefined,
          budgetRange: budgetRange.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "등록에 실패했습니다.");
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>문의 직접 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-name">
                이름 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="lead-name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">
                연락처 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="lead-phone"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lead-source">유입 경로</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-date">희망 날짜</Label>
              <Input
                id="lead-date"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-guests">예상 인원</Label>
              <Input
                id="lead-guests"
                type="number"
                placeholder="200"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-email">이메일</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-budget">예산</Label>
              <Input
                id="lead-budget"
                placeholder="예: 3,000만원대"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lead-message">
              문의 내용 <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="lead-message"
              placeholder="고객의 문의 내용을 입력하세요."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1B1B1B] text-white hover:bg-[#2C2C2C]"
            >
              {saving ? "등록 중..." : "등록"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
