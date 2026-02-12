"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEMPLATE_TRIGGER_LABELS } from "@/lib/constants";
import type { FollowupSequence } from "@/types";

interface FollowupStep {
  delayDays: number;
  templateTrigger: string;
}

const TRIGGER_OPTIONS = Object.entries(TEMPLATE_TRIGGER_LABELS).filter(
  ([key]) => key !== "AUTO_REPLY"
);

const DEFAULT_STEP: FollowupStep = { delayDays: 3, templateTrigger: "FOLLOWUP_D3" };

export default function SequencesPage() {
  const [sequences, setSequences] = useState<FollowupSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<FollowupSequence | null>(null);
  const [deletingSequence, setDeletingSequence] = useState<FollowupSequence | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSteps, setFormSteps] = useState<FollowupStep[]>([{ ...DEFAULT_STEP }]);
  const [formActive, setFormActive] = useState(false);

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch("/api/sequences");
      const data = await res.json();
      setSequences(data.sequences || []);
    } catch {
      toast.error("시퀀스 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  function openCreateDialog() {
    setEditingSequence(null);
    setFormName("");
    setFormSteps([{ ...DEFAULT_STEP }]);
    setFormActive(false);
    setDialogOpen(true);
  }

  function openEditDialog(sequence: FollowupSequence) {
    setEditingSequence(sequence);
    setFormName(sequence.name);
    const steps = sequence.steps as unknown as FollowupStep[];
    setFormSteps(steps.length > 0 ? steps : [{ ...DEFAULT_STEP }]);
    setFormActive(sequence.isActive);
    setDialogOpen(true);
  }

  function openDeleteDialog(sequence: FollowupSequence) {
    setDeletingSequence(sequence);
    setDeleteDialogOpen(true);
  }

  function addStep() {
    setFormSteps((prev) => [...prev, { ...DEFAULT_STEP }]);
  }

  function removeStep(index: number) {
    if (formSteps.length <= 1) return;
    setFormSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof FollowupStep, value: string | number) {
    setFormSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  }

  function moveStep(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formSteps.length) return;
    setFormSteps((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!formName.trim() || formSteps.length === 0) return;
    setSaving(true);

    try {
      if (editingSequence) {
        await fetch("/api/sequences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSequence.id,
            name: formName,
            steps: formSteps,
            isActive: formActive,
          }),
        });
      } else {
        await fetch("/api/sequences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            steps: formSteps,
            isActive: formActive,
          }),
        });
      }

      setDialogOpen(false);
      fetchSequences();
      toast.success(editingSequence ? "시퀀스가 수정되었습니다." : "시퀀스가 생성되었습니다.");
    } catch {
      toast.error("시퀀스 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingSequence) return;
    setSaving(true);

    try {
      await fetch(`/api/sequences?id=${deletingSequence.id}`, {
        method: "DELETE",
      });
      setDeleteDialogOpen(false);
      setDeletingSequence(null);
      fetchSequences();
      toast.success("시퀀스가 삭제되었습니다.");
    } catch {
      toast.error("시퀀스 삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(sequence: FollowupSequence) {
    try {
      await fetch("/api/sequences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sequence.id,
          isActive: !sequence.isActive,
        }),
      });
      fetchSequences();
    } catch {
      toast.error("시퀀스 상태 변경에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[#6B7280]">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1B1B]">
            자동 팔로업
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            문의 고객에게 자동으로 발송할 팔로업 시퀀스를 설정하세요.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="w-full bg-[#1B1B1B] text-white hover:bg-[#2C2C2C] sm:w-auto"
        >
          + 새 시퀀스
        </Button>
      </div>

      {/* Sequence list */}
      {sequences.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <p className="text-[#6B7280]">등록된 시퀀스가 없습니다.</p>
          <Button
            onClick={openCreateDialog}
            variant="outline"
            className="mt-4"
          >
            첫 번째 시퀀스 만들기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence) => {
            const steps = sequence.steps as unknown as FollowupStep[];
            return (
              <div
                key={sequence.id}
                className="rounded-2xl bg-white p-5 shadow-lg"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#1B1B1B]">
                      {sequence.name}
                    </h2>
                    {sequence.isActive ? (
                      <Badge className="bg-[#E8F5E9] text-[#66BB6A]">
                        활성
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[#9E9E9E]"
                      >
                        비활성
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="bg-[#F5F5F0] text-[#6B7280]"
                    >
                      {steps.length}단계
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sequence.isActive}
                      onCheckedChange={() => handleToggleActive(sequence)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(sequence)}
                      className="text-[#6B7280] hover:text-[#1B1B1B]"
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(sequence)}
                      className="text-red-400 hover:text-red-600"
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                {/* Steps preview */}
                {steps.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 overflow-x-auto">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && (
                          <div className="h-px w-6 bg-gray-200" />
                        )}
                        <div className="flex-shrink-0 rounded-lg border border-gray-100 bg-[#FAF9F6] px-3 py-2">
                          <p className="text-xs font-medium text-[#1B1B1B]">
                            {step.delayDays}일 후
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {TEMPLATE_TRIGGER_LABELS[step.templateTrigger] ||
                              step.templateTrigger}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? "시퀀스 수정" : "새 시퀀스 만들기"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="seq-name">이름</Label>
              <Input
                id="seq-name"
                placeholder="예: 기본 팔로업 시퀀스"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Steps editor */}
            <div>
              <Label>단계</Label>
              <div className="mt-2 space-y-2">
                {formSteps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F5F0] text-xs font-medium text-[#6B7280]">
                        {index + 1}
                      </span>
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            className="w-20"
                            value={step.delayDays}
                            onChange={(e) =>
                              updateStep(index, "delayDays", parseInt(e.target.value) || 1)
                            }
                          />
                          <span className="flex-shrink-0 text-sm text-[#6B7280]">
                            일 후
                          </span>
                        </div>
                        <select
                          className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#A8D5BA] focus:ring-1 focus:ring-[#A8D5BA] focus:outline-none"
                          value={step.templateTrigger}
                          onChange={(e) =>
                            updateStep(index, "templateTrigger", e.target.value)
                          }
                        >
                          {TRIGGER_OPTIONS.map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(index, "up")}
                          disabled={index === 0}
                          className="rounded p-1 text-[#9E9E9E] hover:bg-[#F5F5F0] hover:text-[#1B1B1B] disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, "down")}
                          disabled={index === formSteps.length - 1}
                          className="rounded p-1 text-[#9E9E9E] hover:bg-[#F5F5F0] hover:text-[#1B1B1B] disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          disabled={formSteps.length <= 1}
                          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addStep}
              >
                + 단계 추가
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
                id="seq-active"
              />
              <Label htmlFor="seq-active">
                활성화
                {formActive && (
                  <span className="ml-1 text-xs text-[#6B7280]">
                    (다른 시퀀스는 자동으로 비활성화됩니다)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formName.trim() || formSteps.length === 0}
                className="bg-[#1B1B1B] text-white hover:bg-[#2C2C2C]"
              >
                {saving ? "저장 중..." : editingSequence ? "수정" : "만들기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>시퀀스 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            &ldquo;{deletingSequence?.name}&rdquo; 시퀀스를 삭제하시겠습니까?
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {saving ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
