// apps/frontend/src/components/layout/Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, Search, Plus, LogOut, User, LayoutDashboard, KeyRound, Download, Menu, X } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { isUserVerified } from "@/types";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Navbar: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isInstallable, install } = usePWAInstall();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
    setMobileOpen(false);
  };

  const navLinks = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}/search`, label: t("search"), icon: Search },
    ...(mounted && user?.role === "landlord"
      ? [{ href: `/${locale}/listings/new`, label: t("addListing"), icon: Plus }]
      : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#1B2E4A]/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo — always left */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 flex-shrink-0"
            style={{ direction: "ltr" }}
          >
            <img src="/logo.png" alt="سكني" className="h-10 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>

          {/* Center nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <span style={{ direction: "ltr" }}>
                  <link.icon size={16} />
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions — always right, direction ltr */}
          <div className="flex items-center gap-1" style={{ direction: "ltr" }}>
            {/* PWA Install */}
            {isInstallable && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Install app"
              >
                <Download size={16} />
                <span className="hidden lg:inline">
                  {locale === "ar" ? "ثبّت" : "Install"}
                </span>
              </button>
            )}

            {/* Language & Theme */}
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Auth buttons */}
            {!mounted || !user ? (
              <div className="hidden md:flex items-center gap-2 ms-2">
                <Link href={`/${locale}/login`}>
                  <Button variant="outline" size="sm">
                    {locale === "ar" ? "دخول" : "Login"}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button variant="primary" size="sm">
                    {locale === "ar" ? "سجّل" : "Sign up"}
                  </Button>
                </Link>
              </div>
            ) : (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="ms-2 flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                    <Avatar src={user?.avatarUrl || null} name={user?.name || ""} size="sm" verified={isUserVerified(user)} />
                    <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                      {user?.name || ""}
                    </span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    align="end"
                    sideOffset={8}
                  >
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${locale}/dashboard/profile`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 outline-none"
                      >
                        <User size={16} />
                        {locale === "ar" ? "الملف الشخصي" : "Profile"}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href={user.role === "admin" || user.role === "super_admin" ? `/${locale}/admin` : `/${locale}/dashboard/${user.role}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 outline-none"
                      >
                        <LayoutDashboard size={16} />
                        {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${locale}/dashboard/profile`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 outline-none"
                      >
                        <KeyRound size={16} />
                        {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                    <DropdownMenu.Item asChild>
                      <button
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 outline-none"
                      >
                        <LogOut size={16} />
                        {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}

            {/* Mobile hamburger — always rightmost */}
            <button
              className="ms-1 flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer — slides from the right */}
          <div className="absolute end-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4" style={{ direction: "ltr" }}>
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <img src="/logo.png" alt="سكني" className="h-9 w-auto object-contain dark:brightness-0 dark:invert" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* User info in drawer */}
            {mounted && user && (
              <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatarUrl || null} name={user.name} size="md" verified={isUserVerified(user)} />
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span style={{ direction: "ltr" }}>
                    <link.icon size={18} />
                  </span>
                  {link.label}
                </Link>
              ))}

              {mounted && user && (
                <>
                  <Link
                    href={`/${locale}/dashboard/profile`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span style={{ direction: "ltr" }}><User size={18} /></span>
                    {locale === "ar" ? "الملف الشخصي" : "Profile"}
                  </Link>
                  <Link
                    href={user.role === "admin" || user.role === "super_admin" ? `/${locale}/admin` : `/${locale}/dashboard/${user.role}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span style={{ direction: "ltr" }}><LayoutDashboard size={18} /></span>
                    {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                </>
              )}
            </nav>

            {/* Bottom controls */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <div className="flex items-center justify-between" style={{ direction: "ltr" }}>
                <LanguageSwitcher />
                <ThemeToggle />
                {isInstallable && (
                  <button
                    onClick={install}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Download size={16} />
                    {locale === "ar" ? "ثبّت" : "Install"}
                  </button>
                )}
              </div>

              {!mounted || !user ? (
                <div className="flex gap-2">
                  <Link href={`/${locale}/login`} className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="md" fullWidth>
                      {locale === "ar" ? "دخول" : "Login"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/register`} className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>
                      {locale === "ar" ? "سجّل" : "Sign up"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <span style={{ direction: "ltr" }}><LogOut size={18} /></span>
                  {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
