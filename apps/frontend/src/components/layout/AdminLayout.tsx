// apps/frontend/src/components/layout/AdminLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
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
  Home,
  LogOut,
  Archive,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Spinner } from "@/components/ui/spinner";
import { DashboardNavbar } from "./DashboardNavbar";
import { useUiStore } from "@/store/ui.store";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "admin" });
  const locale = useLocale();
  const pathname = usePathname();
  const logout = useLogout();
  
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    {
      label: "لوحة التحكم",
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
      label: "عقود الإيجار",
      labelEn: "Rentals",
      icon: FileText,
      href: `/${locale}/admin/rentals`,
    },
    {
      label: "رسائل الدعم",
      labelEn: "Support",
      icon: MessageCircle,
      href: `/${locale}/admin/chat`,
    },
    {
      label: "إعلانات محذوفة",
      labelEn: "Deleted Ads",
      icon: Archive,
      href: `/${locale}/admin/deleted-advertisements`,
    },
  ];


  const checkActive = (item: typeof menuItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  const isRtl = locale === "ar";

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-e border-slate-800 text-slate-400">
      {/* Nav Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item);
          const labelText = isRtl ? item.label : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-cairo relative group/tooltip",
                isActive
                  ? "bg-[#1B4F8A] text-white shadow-lg shadow-[#1B4F8A]/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} className={cn("shrink-0", isActive ? "text-[#D4A847]" : "text-slate-500")} />
              
              {/* Visible on Desktop and Mobile, hidden on Tablet */}
              <span className="inline md:hidden xl:inline transition-all duration-200">
                {labelText}
              </span>

              {/* Tooltip on Tablet mode (hover) */}
              <span
                className={cn(
                  "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 bg-slate-850 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none border border-slate-700",
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
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-white font-cairo relative group/tooltip"
        >
          <Home size={18} className="text-slate-500 shrink-0" />
          <span className="inline md:hidden xl:inline">{isRtl ? "الرئيسية" : "Home"}</span>
          <span
            className={cn(
              "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 bg-slate-850 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none border border-slate-700",
              isRtl ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {isRtl ? "الرئيسية" : "Home"}
          </span>
        </Link>
        
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-cairo relative group/tooltip"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="inline md:hidden xl:inline">{isRtl ? "تسجيل الخروج" : "Logout"}</span>
          <span
            className={cn(
              "absolute hidden md:group-hover/tooltip:block xl:group-hover/tooltip:hidden px-2.5 py-1.5 bg-slate-850 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none border border-slate-700",
              isRtl ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {isRtl ? "تسجيل الخروج" : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* Unified Thin Dashboard Navbar */}
      <DashboardNavbar />

      {/* Main Workspace below Navbar */}
      <div className="flex-1 flex min-w-0">
        
        {/* Desktop / Tablet Sidebar (w-64 on xl, w-20 on md to xl) */}
        <aside className="hidden md:block xl:w-64 md:w-20 shrink-0 h-[calc(100vh-64px)] sticky top-16 z-30">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Drawer Backdrop */}
        {mounted && sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={cn(
            "fixed top-16 bottom-0 z-50 w-64 bg-slate-900 transition-transform duration-300 ease-in-out md:hidden border-slate-800",
            isRtl
              ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") // Slide from left in RTL
              : (sidebarOpen ? "translate-x-0" : "translate-x-full"),  // Slide from right in LTR
            isRtl ? "left-0 border-r" : "right-0 border-l"
          )}
        >
          {sidebarContent}
        </aside>

        {/* Page Content area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
