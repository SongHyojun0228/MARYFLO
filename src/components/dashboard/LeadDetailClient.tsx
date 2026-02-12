"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LeadDetailClientProps {
  leadId: string;
  currentStatus: string;
  statusLabels: Record<string, string>;
}

export function LeadDetailClient({
  leadId,
  currentStatus,
  statusLabels,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    if (res.ok) {
      setNote("");
      router.refresh();
    }
    setAddingNote(false);
  }

  return (
    <>
      {/* Status Change */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-sm font-semibold text-[#1B1B1B]">
          상태 변경
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              disabled={saving}
              onClick={() => handleStatusChange(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                key === status
                  ? "bg-[#1B1B1B] text-white"
                  : "bg-[#FAF9F6] text-[#6B7280] hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-sm font-semibold text-[#1B1B1B]">
          메모 추가
        </h2>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="메모를 입력하세요..."
          className="mb-3 resize-none"
          rows={3}
        />
        <Button
          onClick={handleAddNote}
          disabled={addingNote || !note.trim()}
          size="sm"
          className="bg-[#1B1B1B] text-white hover:bg-[#333]"
        >
          {addingNote ? "저장 중..." : "메모 저장"}
        </Button>
      </div>
    </>
  );
}
