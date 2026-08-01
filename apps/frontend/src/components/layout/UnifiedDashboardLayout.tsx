// apps/frontend/src/components/layout/UnifiedDashboardLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout, useAuthGuard } from "@/features/auth";
import { useUnreadChatCount } from "@/hooks/useChat";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui";
import { DashboardNavbar } from "./DashboardNavbar";
import { useUiStore } from "@/store/ui.store";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardMenuItem {
  label: string;
  labelEn: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  /** Live badge count shown on sidebar item (e.g. pending requests) */
  badge?: number;
}

type AccentTheme = "blue" | "gold" | "admin";

interface UnifiedDashboardLayoutProps {
  children: React.ReactNode;
  /** قائمة عناصر القائمة الجانبية */
  menuItems: DashboardMenuItem[];
  /** الدور المطلوب للدخول — تستخدمه useAuthGuard */
  role: "tenant" | "landlord" | "admin" | "super_admin";
  /** لون التمييز للعنصر النشط في الشريط الجانبي */
  accentTheme?: AccentTheme;
}

// ── Accent style helpers ────────────────────────────────────────────────────────

const ACCENT_ACTIVE: Record<AccentTheme, string> = {
  blue: "bg-primary/10 text-primary font-bold border-s-4 border-primary",
  gold: "bg-accent/15 text-accent-dark font-bold border-s-4 border-accent",
  admin: "bg-primary text-white shadow-md shadow-primary/20",
};

const ACCENT_ICON: Record<AccentTheme, string> = {
  blue: "text-primary",
  gold: "text-accent-dark",
  admin: "text-accent-light",
};

const SIDEBAR_BG: Record<AccentTheme, string> = {
  blue: "bg-surface border-e border-border",
  gold: "bg-surface border-e border-border",
  admin: "bg-text border-e border-text-secondary/20 text-text-tertiary",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function UnifiedDashboardLayout({
  children,
  menuItems,
  role,
  accentTheme = "blue",
}: UnifiedDashboardLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const logout = useLogout();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role });

  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const { data: chatUnreadData } = useUnreadChatCount(!!user);
  const chatUnreadCount = chatUnreadData?.unreadCount ?? 0;

  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("Service Worker registered scope:", reg.scope);
      }).catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });

      const handlePushMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "PUSH_RECEIVED") {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
          queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
        }
      };

      navigator.serviceWorker.addEventListener("message", handlePushMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handlePushMessage);
      };
    }
  }, [queryClient]);

  const isRtl = locale === "ar";

  const checkActive = (item: DashboardMenuItem) => {
    if (item.exact) return pathname === item.href;
    return pathname?.startsWith(item.href);
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50" dir={isRtl ? "rtl" : "ltr"}>
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // ── Sidebar Content ──────────────────────────────────────────────────────────
  const isAdmin = accentTheme === "admin";

  const sidebarContent = (
    <div className={cn("flex flex-col h-full", SIDEBAR_BG[accentTheme])}>
      {/* Nav Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item);
          const labelText = isRtl ? item.label : item.labelEn;
          const isSupportLink = item.href.endsWith("/support") || item.href.endsWith("/chat");
          const showBadge = item.badge && item.badge > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-cairo relative group/tooltip",
                isActive
                  ? ACCENT_ACTIVE[accentTheme]
                  : isAdmin
                    ? "text-slate-400 hover:bg-white/5 hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0",
                  isActive ? ACCENT_ICON[accentTheme] : isAdmin ? "text-slate-500" : "text-slate-400"
                )}
              />

              {/* Label — visible on mobile & desktop, hidden on tablet (icon-only) */}
              <span className="inline md:hidden xl:inline transition-all duration-200">
                {labelText}
              </span>

              {/* Custom badge from menuItem.badge prop */}
              {showBadge && (
                <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white transition-all shrink-0"
                  style={{ background: "#D4A847" }}>
                  {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                </span>
              )}

              {/* Support Unread badge */}
              {isSupportLink && chatUnreadCount > 0 && !showBadge && (
                <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white transition-all shrink-0">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              )}

              {/* Tooltip on tablet hover (hidden on desktop where text is visible) */}
              <span
                className={cn(
                  "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
                  isAdmin
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-slate-800 border border-slate-700",
                  isRtl ? "right-full mr-3" : "left-full ml-3"
                )}
              >
                {labelText}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className={cn("p-3 border-t space-y-1", isAdmin ? "border-slate-800" : "border-slate-200")}>

        {/* Language & Theme — only on mobile/tablet (navbar shows them on desktop) */}
        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 xl:hidden">
            <LanguageSwitcher />
          </div>
        )}

        {/* Home link */}
        <Link
          href={`/${locale}`}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium font-cairo relative group/tooltip transition-all",
            isAdmin
              ? "text-slate-400 hover:bg-white/5 hover:text-white"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <Home size={18} className={cn("shrink-0", isAdmin ? "text-slate-500" : "text-slate-400")} />
          <span className="inline md:hidden xl:inline">{isRtl ? "الرئيسية" : "Home"}</span>
          <span
            className={cn(
              "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
              isAdmin ? "bg-slate-900 border border-slate-700" : "bg-slate-800 border border-slate-700",
              isRtl ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {isRtl ? "الرئيسية" : "Home"}
          </span>
        </Link>

        {/* Logout */}
        <Button
          variant="ghost"
          size="md"
          onClick={() => logout.mutate()}
          className={cn(
            "w-full flex items-center justify-start gap-3 px-3 py-3 rounded-xl text-sm transition-all font-cairo relative group/tooltip",
            isAdmin
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-status-danger hover:bg-red-50"
          )}
          leftIcon={<LogOut size={18} className="shrink-0" />}
        >
          <span className="inline md:hidden xl:inline">{isRtl ? "تسجيل الخروج" : "Logout"}</span>
          <span
            className={cn(
              "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
              isAdmin ? "bg-slate-900 border border-slate-700" : "bg-slate-800 border border-slate-700",
              isRtl ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {isRtl ? "تسجيل الخروج" : "Logout"}
          </span>
        </Button>
      </div>
    </div>
  );

  // ── Layout ───────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        isAdmin ? "bg-slate-100" : "bg-slate-50"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Unified Dashboard Navbar */}
      <DashboardNavbar />

      {/* Main workspace below navbar */}
      <div className="flex-1 flex min-w-0">

        {/* Desktop / Tablet Sidebar (w-64 on xl, w-20 on md→xl) */}
        <aside className="hidden md:block xl:w-64 md:w-20 shrink-0 h-[calc(100vh-64px)] sticky top-16 z-30">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Backdrop */}
        {mounted && sidebarOpen && (
          <div
            className={cn(
              "fixed inset-0 backdrop-blur-sm z-40 md:hidden",
              isAdmin ? "bg-slate-950/60" : "bg-slate-900/40"
            )}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={cn(
            "fixed top-16 bottom-0 z-50 w-64 transition-transform duration-300 ease-in-out md:hidden",
            isAdmin ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
            isRtl
              ? sidebarOpen ? "translate-x-0 left-0 border-r" : "-translate-x-full left-0 border-r"
              : sidebarOpen ? "translate-x-0 right-0 border-l" : "translate-x-full right-0 border-l"
          )}
        >
          {sidebarContent}
        </aside>

        {/* Page Content */}
        <main className={cn(
          "flex-1 max-w-7xl mx-auto w-full min-w-0 overflow-y-auto",
          isAdmin ? "p-4 sm:p-6 md:p-8" : "py-8 px-4 sm:px-6 md:px-8"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
