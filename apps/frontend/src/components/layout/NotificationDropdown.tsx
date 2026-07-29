// apps/frontend/src/components/layout/NotificationDropdown.tsx
"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { NotificationDrawer } from "./NotificationDrawer";

import { Button } from "@/components/ui";

export interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <>
      <Button
        type="button"
        id="notification-bell-button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
        className={cn(
          "relative h-9 w-9 p-0 rounded-xl shrink-0 cursor-pointer text-text-secondary hover:text-text hover:bg-surface-tertiary",
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
              "rounded-full bg-status-danger px-0.5",
              "text-[10px] font-bold leading-none text-white",
              "ring-2 ring-surface",
              "animate-in zoom-in-75 duration-200"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
