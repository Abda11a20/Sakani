// apps/frontend/src/components/layout/NotificationDrawer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Button } from "@/components/ui";
import {
  X,
  CheckCheck,
  ExternalLink,
  Bell,
  Home,
  FileText,
  UserCheck,
  CreditCard,
  Star,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { formatNotification, FormattedNotification } from "@/lib/utils/notification-formatter";
import { useAuthStore } from "@/features/auth";
import { Spinner } from "@/components/ui/spinner";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<FormattedNotification["iconName"], React.ElementType> = {
  Home,
  FileText,
  UserCheck,
  CreditCard,
  Star,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
};

const CATEGORY_STYLES: Record<FormattedNotification["category"], { bg: string; text: string }> = {
  listing: { bg: "bg-blue-50 border-blue-200", text: "text-blue-600" },
  rental: { bg: "bg-amber-50 border-amber-200", text: "text-amber-600" },
  request: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-600" },
  payment: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600" },
  community: { bg: "bg-purple-50 border-purple-200", text: "text-purple-600" },
  alert: { bg: "bg-rose-50 border-rose-200", text: "text-rose-600" },
  system: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600" },
};

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: notificationsData, isLoading } = useNotifications(1, 10);
  const { data: unreadData } = useUnreadNotificationsCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  if (!isOpen || !mounted) return null;

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadData?.unreadCount ?? 0;

  const handleNotificationClick = (id: string, isRead: boolean, route: string | null) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
    if (route) {
      router.push(`/${locale}${route}`);
      onClose();
    }
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] overflow-hidden font-cairo" dir={isAr ? "rtl" : "ltr"}>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col border-s border-slate-200 transition-all duration-300 z-[100000] ${
          isAr ? "right-0 border-r border-slate-200" : "right-0 border-l border-slate-200"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-800" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <h2 className="text-base font-black text-slate-900">
              {isAr ? "الإشعارات" : "Notifications"}
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-700 rounded-full">
                {unreadCount} {isAr ? "جديد" : "new"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                loading={markAllReadMutation.isPending}
                className="text-xs text-primary hover:bg-surface-tertiary font-bold px-2.5 py-1 rounded-xl"
                title={isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">
                  {isAr ? "قراءة الكل" : "Mark all read"}
                </span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 text-text-secondary hover:text-text rounded-xl hover:bg-surface-tertiary"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Spinner size="md" />
              <p className="text-xs text-slate-400">
                {isAr ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {isAr ? "لا توجد إشعارات حالياً" : "No notifications yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                {isAr
                  ? "ستظهر هنا جميع التنبيهات والطلبات وتحديثات عقود الإيجار."
                  : "Notifications about rentals, listings, and requests will appear here."}
              </p>
            </div>
          ) : (
            notifications.map((item: any) => {
              const formatted = formatNotification(item, locale, user?.role);
              const IconComponent = ICON_MAP[formatted.iconName] || Bell;
              const categoryStyle = CATEGORY_STYLES[formatted.category] || CATEGORY_STYLES.system;

              const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
                locale: isAr ? arSA : enUS,
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item.id, item.isRead, formatted.route)}
                  className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    !item.isRead
                      ? "bg-blue-50/50 border-blue-200 shadow-xs"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${categoryStyle.bg} ${categoryStyle.text}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className={`text-xs ${
                            !item.isRead ? "text-slate-900 font-black" : "text-slate-800 font-bold"
                          }`}
                        >
                          {formatted.title}
                        </h3>

                        {/* Unread Dot */}
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">
                        {formatted.body}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{timeAgo}</span>

                        {/* CTA Link Button if Route exists */}
                        {formatted.route && (
                          <Link
                            href={`/${locale}${formatted.route}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <span>{isAr ? "عرض التفاصيل" : "View Details"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <Link href={`/${locale}/dashboard/notifications`} onClick={onClose}>
            <Button variant="outline" className="w-full justify-center text-xs font-bold py-2.5 rounded-xl border-slate-200 hover:bg-slate-100">
              {isAr ? "عرض جميع الإشعارات" : "View All Notifications"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
