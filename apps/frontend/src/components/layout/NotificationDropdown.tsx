// apps/frontend/src/components/layout/NotificationDropdown.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";

export interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const locale = useLocale();
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <Link
      href={`/${locale}/dashboard/notifications`}
      id="notification-bell-button"
      aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0",
        "text-slate-600 dark:text-slate-300",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        className
      )}
    >
      <Bell size={18} />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} unread`}
          className={cn(
            "absolute -top-0.5 -end-0.5",
            "flex h-4 min-w-4 items-center justify-center",
            "rounded-full bg-red-500 px-0.5",
            "text-[10px] font-bold leading-none text-white",
            "ring-2 ring-white dark:ring-slate-900",
            "animate-in zoom-in-75 duration-200"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
