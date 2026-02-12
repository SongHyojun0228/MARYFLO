"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEMPLATE_TRIGGER_LABELS } from "@/lib/constants";
import type { MessageTemplate } from "@/types";

const TRIGGER_OPTIONS = Object.entries(TEMPLATE_TRIGGER_LABELS);

const TEMPLATE_VARIABLES = [
  { name: "{{name}}", desc: "고객 이름" },
  { name: "{{date}}", desc: "희망 날짜" },
  { name: "{{guest_count}}", desc: "예상 인원" },
  { name: "{{business_name}}", desc: "업체 이름" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("AUTO_REPLY");
  const [formContent, setFormContent] = useState("");
  const [formActive, setFormActive] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      console.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreateDialog() {
    setEditingTemplate(null);
    setFormName("");
    setFormTrigger("AUTO_REPLY");
    setFormContent("");
    setFormActive(true);
    setDialogOpen(true);
  }

  function openEditDialog(template: MessageTemplate) {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormTrigger(template.trigger);
    setFormContent(template.content);
    setFormActive(template.isActive);
    setDialogOpen(true);
  }

  function openDeleteDialog(template: MessageTemplate) {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formContent.trim()) return;
    setSaving(true);

    try {
      if (editingTemplate) {
        // Update
        await fetch("/api/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTemplate.id,
            name: formName,
            trigger: formTrigger,
            content: formContent,
            isActive: formActive,
          }),
        });
      } else {
        // Create
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            trigger: formTrigger,
            content: formContent,
            isActive: formActive,
          }),
        });
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch {
      console.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingTemplate) return;
    setSaving(true);

    try {
      await fetch(`/api/templates?id=${deletingTemplate.id}`, {
        method: "DELETE",
      });
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch {
      console.error("Failed to delete template");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(template: MessageTemplate) {
    try {
      await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          isActive: !template.isActive,
        }),
      });
      fetchTemplates();
    } catch {
      console.error("Failed to toggle template");
    }
  }

  // Group templates by trigger
  const grouped = templates.reduce(
    (acc, t) => {
      const key = t.trigger;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, MessageTemplate[]>
  );

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
            메시지 템플릿
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            알림톡 발송에 사용할 메시지 템플릿을 관리하세요.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="w-full bg-[#1B1B1B] text-white hover:bg-[#2C2C2C] sm:w-auto"
        >
          + 새 템플릿
        </Button>
      </div>

      {/* Template list grouped by trigger */}
      {templates.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <p className="text-[#6B7280]">등록된 템플릿이 없습니다.</p>
          <Button
            onClick={openCreateDialog}
            variant="outline"
            className="mt-4"
          >
            첫 번째 템플릿 만들기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {TRIGGER_OPTIONS.map(([triggerKey, triggerLabel]) => {
            const items = grouped[triggerKey];
            if (!items || items.length === 0) return null;

            return (
              <div key={triggerKey} className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#1B1B1B]">
                    {triggerLabel}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-[#F5F5F0] text-[#6B7280]"
                  >
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-[#1B1B1B]">
                              {template.name}
                            </p>
                            {!template.isActive && (
                              <Badge
                                variant="outline"
                                className="text-[#9E9E9E]"
                              >
                                비활성
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">
                            {template.content}
                          </p>
                        </div>
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => handleToggleActive(template)}
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="mt-2 flex gap-1 sm:mt-0 sm:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                          className="text-[#6B7280] hover:text-[#1B1B1B]"
                        >
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(template)}
                          className="text-red-400 hover:text-red-600"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
              {editingTemplate ? "템플릿 수정" : "새 템플릿 만들기"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">이름</Label>
              <Input
                id="template-name"
                placeholder="예: 자동 응답 - 기본"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="template-trigger">트리거</Label>
              <select
                id="template-trigger"
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#A8D5BA] focus:ring-1 focus:ring-[#A8D5BA] focus:outline-none"
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
              >
                {TRIGGER_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="template-content">내용</Label>
              <Textarea
                id="template-content"
                placeholder="안녕하세요, {{name}}님! {{business_name}}입니다."
                rows={5}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    className="rounded-md bg-[#F5F5F0] px-2 py-1 text-xs text-[#6B7280] hover:bg-[#E8E4DF]"
                    onClick={() =>
                      setFormContent((prev) => prev + v.name)
                    }
                  >
                    {v.name} <span className="text-[#9E9E9E]">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
                id="template-active"
              />
              <Label htmlFor="template-active">활성화</Label>
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
                disabled={saving || !formName.trim() || !formContent.trim()}
                className="bg-[#1B1B1B] text-white hover:bg-[#2C2C2C]"
              >
                {saving ? "저장 중..." : editingTemplate ? "수정" : "만들기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>템플릿 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            &ldquo;{deletingTemplate?.name}&rdquo; 템플릿을 삭제하시겠습니까?
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
