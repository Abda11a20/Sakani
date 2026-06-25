// apps/frontend/src/components/layout/LandlordLayout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  Building,
  GitPullRequest,
  Bed,
  Settings,
  Menu,
  X,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface LandlordLayoutProps {
  children: React.ReactNode;
}

export default function LandlordLayout({ children }: LandlordLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: "نظرة عامة",
      labelEn: "Overview",
      icon: LayoutDashboard,
      href: `/${locale}/dashboard/landlord`,
      exact: true,
    },
    {
      label: "إعلاناتي",
      labelEn: "My Listings",
      icon: Building,
      href: `/${locale}/dashboard/landlord/listings`,
    },
    {
      label: "الطلبات الواردة",
      labelEn: "Incoming Requests",
      icon: GitPullRequest,
      href: `/${locale}/dashboard/landlord/requests`,
    },
    {
      label: "إدارة الأسرة",
      labelEn: "Bed Management",
      icon: Bed,
      href: `/${locale}/dashboard/landlord/beds`,
    },
    {
      label: "ملفي الشخصي",
      labelEn: "My Profile",
      icon: Settings,
      href: `/${locale}/dashboard/profile`,
    },
  ];

  const checkActive = (item: typeof menuItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  const isRtl = locale === "ar";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <img src="/logo.png" alt="سكني" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-cairo",
                isActive
                  ? "bg-[#D4A847]/10 text-[#C49535] dark:text-[#E8C06A] font-bold border-s-4 border-[#D4A847] pl-3"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon size={18} className={cn("shrink-0", isActive ? "text-[#D4A847]" : "text-slate-400")} />
              <span>{isRtl ? item.label : item.labelEn}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-cairo"
        >
          <Home size={18} className="text-slate-400" />
          <span>{isRtl ? "الرئيسية" : "Home"}</span>
        </Link>
        <div className="flex items-center justify-between px-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex" style={{ direction: "ltr" }}>
      {/* Desktop Sidebar (Fixed Left/Right depending on Locale) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "left-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="سكني" className="h-7 w-auto object-contain dark:brightness-0 dark:invert" />
          </div>
          <div className="w-10"></div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 py-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
