"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: "📊" },
  { href: "/dashboard/leads", label: "문의 고객", icon: "👥" },
  { href: "/dashboard/messages", label: "메시지", icon: "💬" },
  { href: "/dashboard/calendar", label: "일정", icon: "📅" },
];

const MOBILE_MORE_ITEMS = [
  { href: "/dashboard/templates", label: "메시지 템플릿", icon: "📝" },
  { href: "/dashboard/sequences", label: "자동 팔로업", icon: "🔄" },
  { href: "/dashboard/reports", label: "리포트", icon: "📈" },
  { href: "/dashboard/settings", label: "설정", icon: "⚙️" },
];

const SIDEBAR_EXTRA_ITEMS = [
  { href: "/dashboard/templates", label: "메시지 템플릿", icon: "📝" },
  { href: "/dashboard/sequences", label: "자동 팔로업", icon: "🔄" },
  { href: "/dashboard/reports", label: "리포트", icon: "📈" },
];

interface SidebarProps {
  userEmail: string;
  businessName: string | null;
}

export function Sidebar({ userEmail, businessName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  const isMoreActive = MOBILE_MORE_ITEMS.some((item) =>
    pathname.startsWith(item.href)
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white sm:flex">
        {/* Logo + business name */}
        <div className="border-b border-gray-100 p-5">
          <Link
            href="/dashboard"
            className="font-logo block text-lg text-[#1B1B1B]"
          >
            MARIFLO
          </Link>
          {businessName && (
            <p className="mt-1.5 truncate text-sm font-medium text-[#6B7280]">
              {businessName}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {[...NAV_ITEMS, { href: "/dashboard/settings", label: "설정", icon: "⚙️" }, ...SIDEBAR_EXTRA_ITEMS].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-[#FAF9F6] text-[#1B1B1B]"
                  : "text-[#6B7280] hover:bg-[#FAF9F6] hover:text-[#1B1B1B]"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 p-4">
          <p className="mb-2 truncate text-xs text-[#6B7280]">{userEmail}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[#6B7280] hover:bg-[#FAF9F6] hover:text-[#1B1B1B]"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white sm:hidden">
        {/* More menu overlay */}
        {moreOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute right-0 bottom-full z-50 mb-0 mr-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
              {MOBILE_MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-[#FAF9F6] font-medium text-[#1B1B1B]"
                      : "text-[#6B7280] active:bg-[#FAF9F6]"
                  )}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  setMoreOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#6B7280] active:bg-[#FAF9F6]"
              >
                <span>👋</span>
                로그아웃
              </button>
            </div>
          </>
        )}

        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive(item.href)
                  ? "text-[#1B1B1B]"
                  : "text-[#6B7280]"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              moreOpen || isMoreActive
                ? "text-[#1B1B1B]"
                : "text-[#6B7280]"
            )}
          >
            <span className="text-lg">•••</span>
            더보기
          </button>
        </div>
      </nav>
    </>
  );
}
