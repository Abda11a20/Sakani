// apps/frontend/src/components/layout/AdminLayout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldBan,
  ClipboardList,
  MessageCircle,
  Settings,
  Home,
  Menu,
  X,
  Shield,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  labelEn: string;
  icon: React.ElementType;
  href: string;
  exact?: boolean;
  badge?: number;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const logout = useLogout();
  const isRtl = locale === "ar";
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems: NavItem[] = [
    {
      label: "الإحصائيات",
      labelEn: "Dashboard",
      icon: LayoutDashboard,
      href: `/${locale}/admin`,
      exact: true,
    },
    {
      label: "مراجعة الإعلانات",
      labelEn: "Review Listings",
      icon: Building2,
      href: `/${locale}/admin/listings`,
    },
    {
      label: "إدارة المستخدمين",
      labelEn: "Users",
      icon: Users,
      href: `/${locale}/admin/users`,
    },
    {
      label: "المحظورون",
      labelEn: "Banned",
      icon: ShieldBan,
      href: `/${locale}/admin/banned`,
    },
    {
      label: "طلبات المعاينة",
      labelEn: "View Requests",
      icon: ClipboardList,
      href: `/${locale}/admin/requests`,
    },
    {
      label: "رسائل الدعم",
      labelEn: "Support",
      icon: MessageCircle,
      href: `/${locale}/admin/chat`,
    },
  ];

  const checkActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname?.startsWith(item.href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white font-cairo block leading-tight">
            {isRtl ? "لوحة الإدارة" : "Admin Panel"}
          </span>
          <span className="text-xs text-amber-400 font-medium font-cairo">
            {isRtl ? "سكني — النظام" : "Sakany System"}
          </span>
        </div>
      </div>

      {/* Admin Badge */}
      {mounted && user && (
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm font-cairo shrink-0">
            {user.name?.charAt(0) ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate font-cairo">{user.name}</p>
            <p className="text-xs text-slate-400 font-cairo">{user.role === "super_admin" ? "Super Admin" : "Admin"}</p>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-cairo">
          {isRtl ? "القائمة الرئيسية" : "Main Menu"}
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 font-cairo group",
                isActive
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-amber-400"
                )}
              />
              <span className="flex-1">{isRtl ? item.label : item.labelEn}</span>
              {isActive && (
                <ChevronRight
                  size={14}
                  className={cn("shrink-0 text-white/60", isRtl && "rotate-180")}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all font-cairo"
          onClick={() => setIsOpen(false)}
        >
          <Home size={18} className="text-slate-500" />
          <span>{isRtl ? "العودة للموقع" : "Back to Site"}</span>
        </Link>
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-cairo"
        >
          <LogOut size={18} />
          <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
        </button>
        <div className="flex items-center justify-between px-3 pt-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-100 dark:bg-slate-950 flex"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      {/* Desktop Sidebar — 260px */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 z-50 w-[260px] transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full",
          isRtl ? "right-0" : "left-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-500" />
            <span className="font-bold text-base font-cairo">
              {isRtl ? "لوحة الإدارة" : "Admin Panel"}
            </span>
          </div>
          <button
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
