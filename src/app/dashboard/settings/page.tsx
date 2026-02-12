"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";

interface BusinessSettings {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string | null;
  solapiApiKey: string | null;
  solapiSecret: string | null;
  slackWebhook: string;
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state for editable fields
  const [solapiApiKey, setSolapiApiKey] = useState("");
  const [solapiSecret, setSolapiSecret] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
        setSlackWebhook(data.business.slackWebhook ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const body: Record<string, string> = { slackWebhook };
    if (solapiApiKey) body.solapiApiKey = solapiApiKey;
    if (solapiSecret) body.solapiSecret = solapiSecret;

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setBusiness(data.business);
      setSolapiApiKey("");
      setSolapiSecret("");
      setMessage("저장되었습니다.");
    } else {
      setMessage("저장에 실패했습니다.");
    }
    setSaving(false);
  }

  function handleCopyLink() {
    if (!business) return;
    const url = `${window.location.origin}/inquiry/${business.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#6B7280]">
        불러오는 중...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#6B7280]">
        업체 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">설정</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          업체 정보 및 API 연동 설정을 관리합니다.
        </p>
      </div>

      {/* Business Info (Read-only) */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
          업체 정보
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="업체명" value={business.name} />
          <ReadonlyField
            label="업종"
            value={BUSINESS_TYPE_LABELS[business.type] ?? business.type}
          />
          <ReadonlyField label="전화번호" value={business.phone} />
          <ReadonlyField label="이메일" value={business.email ?? "-"} />
        </div>
      </div>

      {/* API Settings (Editable) */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
          API 연동
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="solapiApiKey" className="text-[#6B7280]">
              Solapi API Key
            </Label>
            <Input
              id="solapiApiKey"
              type="password"
              placeholder={
                business.solapiApiKey ? "설정됨 (변경하려면 입력)" : "미설정"
              }
              value={solapiApiKey}
              onChange={(e) => setSolapiApiKey(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="solapiSecret" className="text-[#6B7280]">
              Solapi API Secret
            </Label>
            <Input
              id="solapiSecret"
              type="password"
              placeholder={
                business.solapiSecret ? "설정됨 (변경하려면 입력)" : "미설정"
              }
              value={solapiSecret}
              onChange={(e) => setSolapiSecret(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slackWebhook" className="text-[#6B7280]">
              Slack Webhook URL
            </Label>
            <Input
              id="slackWebhook"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1B1B1B] text-white hover:bg-[#333]"
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
            {message && (
              <span className="text-sm text-[#6B7280]">{message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Inquiry Form Link */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-[#1B1B1B]">
          문의 폼 링크
        </h2>
        <p className="mb-3 text-sm text-[#6B7280]">
          이 링크를 웹사이트나 인스타그램 프로필에 추가하세요.
        </p>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/inquiry/${business.id}`}
            className="flex-1 bg-[#FAF9F6] text-sm"
          />
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="shrink-0"
          >
            {copied ? "복사 완료!" : "복사"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#1B1B1B]">{value}</p>
    </div>
  );
}
