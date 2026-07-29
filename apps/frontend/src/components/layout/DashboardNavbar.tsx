// apps/frontend/src/components/layout/DashboardNavbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Menu, LogOut, User, LayoutDashboard } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/features/auth";
import { isUserVerified } from "@/types";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Avatar } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui.store";

import { Button } from "@/components/ui";

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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur-md shadow-xs h-16">
      <div className="mx-auto flex h-full items-center justify-between px-3 sm:px-6 lg:px-8">

        {/* Logo — Start */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <img
            src="/icon-192.png"
            alt="سكني"
            className="h-9 w-9 object-contain rounded-xl shadow-xs"
          />
          <span className="hidden sm:block text-base font-extrabold text-text tracking-tight">
            {isRtl ? "سكني" : "Sakany"}
          </span>
        </Link>

        {/* Actions — End */}
        <div className="flex items-center gap-1.5">
          <div className="hidden xl:flex items-center gap-1">
            <LanguageSwitcher />
          </div>

          {mounted && user && (
            <NotificationDropdown />
          )}

          {mounted && user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="sm" className="ms-1 flex items-center gap-2 rounded-xl p-1 h-auto hover:bg-surface-tertiary">
                  <Avatar
                    src={user?.avatarUrl || null}
                    name={user?.name || ""}
                    size="sm"
                    verified={isUserVerified(user)}
                  />
                  <span className="hidden lg:block text-sm font-medium text-text max-w-[100px] truncate">
                    {user?.name || ""}
                  </span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[210px] overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                  align="end"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 mb-1 border-b border-divider">
                    <p className="text-sm font-bold text-text truncate">{user?.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user?.email || user?.phone}</p>
                  </div>

                  {user.role !== "admin" && user.role !== "super_admin" && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${locale}/dashboard/profile`}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-surface-tertiary outline-none"
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
                      className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-surface-tertiary outline-none"
                    >
                      <LayoutDashboard size={16} />
                      {user.role === "admin" || user.role === "super_admin"
                        ? locale === "ar" ? "لوحة الإدارة" : "Admin Panel"
                        : locale === "ar" ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-divider" />
                  <DropdownMenu.Item asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start text-status-danger hover:bg-red-50 dark:hover:bg-red-950/20"
                      leftIcon={<LogOut size={16} />}
                    >
                      {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                    </Button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-9 w-9 p-0 rounded-lg text-text-secondary hover:bg-surface-tertiary xl:hidden shrink-0 ms-1"
            aria-label="Toggle Sidebar"
          >
            <Menu size={22} />
          </Button>
        </div>
      </div>
    </header>
  );
};
export default DashboardNavbar;
