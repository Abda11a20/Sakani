// apps/frontend/src/components/layout/DashboardNavbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Menu, LogOut, User, LayoutDashboard } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { isUserVerified } from "@/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Avatar } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui.store";

export const DashboardNavbar: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  const isRtl = locale === "ar";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shadow-sm h-16">
      <div className="mx-auto flex h-full items-center justify-between px-3 sm:px-6 lg:px-8">

        {/* Logo — Start (Right in RTL, Left in LTR) */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {/* App icon */}
          <img
            src="/icon-192.png"
            alt="سكني"
            className="h-9 w-9 object-contain rounded-xl shadow-sm"
          />
          {/* Brand name */}
          <span className="hidden sm:block text-base font-black text-slate-800 dark:text-white tracking-tight">
            {isRtl ? "سكني" : "Sakany"}
          </span>
        </Link>

        {/* Actions — End (Left in RTL, Right in LTR) */}
        <div className="flex items-center gap-1.5">
          {/* Language & Theme — HIDDEN on mobile (shown in sidebar instead) */}
          <div className="hidden xl:flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Notification Bell */}
          {mounted && user && (
            <NotificationDropdown />
          )}

          {/* User Avatar / Dropdown */}
          {mounted && user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="ms-1 flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <Avatar
                    src={user?.avatarUrl || null}
                    name={user?.name || ""}
                    size="sm"
                    verified={isUserVerified(user)}
                  />
                  {/* Name — only on large desktop */}
                  <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name || ""}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[210px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                  align="end"
                  sideOffset={8}
                >
                  {/* User info header */}
                  <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || user?.phone}</p>
                  </div>

                  {user.role !== "admin" && user.role !== "super_admin" && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${locale}/dashboard/profile`}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none"
                      >
                        <User size={16} />
                        {locale === "ar" ? "الملف الشخصي" : "Profile"}
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item asChild>
                    <Link
                      href={
                        user.role === "admin" || user.role === "super_admin"
                          ? `/${locale}/admin`
                          : `/${locale}/dashboard/${user.role}`
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none"
                    >
                      <LayoutDashboard size={16} />
                      {user.role === "admin" || user.role === "super_admin"
                        ? locale === "ar" ? "لوحة الإدارة" : "Admin Panel"
                        : locale === "ar" ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 outline-none"
                    >
                      <LogOut size={16} />
                      {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}

          {/* Hamburger — ALWAYS LAST CHILD in actions container, so it goes to the far edge */}
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors xl:hidden focus:outline-none focus:ring-2 focus:ring-primary shrink-0 ms-1"
            aria-label="Toggle Sidebar"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};
export default DashboardNavbar;
