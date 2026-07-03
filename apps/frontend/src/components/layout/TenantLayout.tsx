// apps/frontend/src/components/layout/TenantLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  Heart,
  Bell,
  User,
  X,
  Home,
  LogOut,
  MessageSquare,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Spinner } from "@/components/ui/spinner";
import { DashboardNavbar } from "./DashboardNavbar";
import { useUiStore } from "@/store/ui.store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const logout = useLogout();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "tenant" });
  
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
      href: `/${locale}/dashboard/tenant`,
      exact: true,
    },
    {
      label: "سجل إيجاراتي",
      labelEn: "Rental History",
      icon: History,
      href: `/${locale}/dashboard/tenant/rental-history`,
    },
    {
      label: "المفضلة",
      labelEn: "Wishlist",
      icon: Heart,
      href: `/${locale}/dashboard/tenant/wishlist`,
    },
    {
      label: "التنبيهات الذكية",
      labelEn: "Smart Alerts",
      icon: Bell,
      href: `/${locale}/dashboard/tenant/alerts`,
    },
    {
      label: "ملفي الشخصي",
      labelEn: "Profile",
      icon: User,
      href: `/${locale}/dashboard/profile`,
    },
    {
      label: "الدعم الفني",
      labelEn: "Support Chat",
      icon: MessageSquare,
      href: `/${locale}/dashboard/support`,
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800">
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
                  ? "bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/20 dark:text-[#7BAEE8] font-bold border-s-4 border-[#1B4F8A]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon size={18} className={cn("shrink-0", isActive ? "text-[#1B4F8A] dark:text-[#7BAEE8]" : "text-slate-400")} />
              
              {/* Visible on Desktop and Mobile, hidden on Tablet */}
              <span className="inline md:hidden xl:inline transition-all duration-200">
                {labelText}
              </span>

              {/* Tooltip on Tablet mode (hover) */}
              <span
                className={cn(
                  "absolute hidden xl:hidden group-hover/tooltip:block px-2.5 py-1.5 bg-slate-800 dark:bg-slate-950 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">

        {/* Language & Theme — only visible on mobile/tablet (navbar shows them on desktop) */}
        <div className="flex items-center gap-2 px-3 py-2 xl:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-cairo relative group/tooltip"
        >
          <Home size={18} className="text-slate-400 shrink-0" />
          <span className="inline md:hidden xl:inline">{isRtl ? "الرئيسية" : "Home"}</span>
          <span
            className={cn(
              "absolute hidden xl:hidden group-hover/tooltip:block px-2.5 py-1.5 bg-slate-800 dark:bg-slate-950 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
              isRtl ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {isRtl ? "الرئيسية" : "Home"}
          </span>
        </Link>
        
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-cairo relative group/tooltip"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="inline md:hidden xl:inline">{isRtl ? "تسجيل الخروج" : "Logout"}</span>
          <span
            className={cn(
              "absolute hidden xl:hidden group-hover/tooltip:block px-2.5 py-1.5 bg-slate-800 dark:bg-slate-950 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 font-cairo font-normal pointer-events-none",
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={cn(
            "fixed top-16 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out md:hidden border-slate-200 dark:border-slate-800",
            isRtl
              ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") // Slide from left in RTL
              : (sidebarOpen ? "translate-x-0" : "translate-x-full"),  // Slide from right in LTR
            isRtl ? "left-0 border-r" : "right-0 border-l"
          )}
        >
          {sidebarContent}
        </aside>

        {/* Page Content area */}
        <main className="flex-1 py-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
