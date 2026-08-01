// apps/frontend/src/app/[locale]/dashboard/notifications/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "@/features/auth";
import TenantLayout from "@/components/layout/TenantLayout";
import LandlordLayout from "@/components/layout/LandlordLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useUnreadNotificationsCount,
} from "@/hooks/useNotifications";
import { formatNotification, FormattedNotification } from "@/lib/utils/notification-formatter";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  useToast,
} from "@/components/ui";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Calendar,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronLeft,
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
  ShieldCheck,
  Lock,
  KeyRound,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

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
  ShieldCheck,
  Lock,
  KeyRound,
};

const CATEGORY_STYLES: Record<FormattedNotification["category"], { bg: string; text: string; labelAr: string; labelEn: string }> = {
  listing: { bg: "bg-primary/10 border-primary/20", text: "text-primary", labelAr: "إعلان", labelEn: "Listing" },
  rental: { bg: "bg-status-warning/15 border-status-warning/30", text: "text-status-warning", labelAr: "عقد إيجار", labelEn: "Rental" },
  request: { bg: "bg-primary/10 border-primary/20", text: "text-primary", labelAr: "طلب معاينة", labelEn: "Viewing Request" },
  payment: { bg: "bg-status-success/15 border-status-success/30", text: "text-status-success", labelAr: "دفع", labelEn: "Payment" },
  community: { bg: "bg-status-info/15 border-status-info/30", text: "text-status-info", labelAr: "مجتمع", labelEn: "Community" },
  alert: { bg: "bg-status-danger/15 border-status-danger/30", text: "text-status-danger", labelAr: "تنبيه", labelEn: "Alert" },
  system: { bg: "bg-surface-tertiary border-border", text: "text-text-secondary", labelAr: "نظام", labelEn: "System" },
  security: { bg: "bg-status-success/15 border-status-success/30", text: "text-status-success", labelAr: "أمان", labelEn: "Security" },
};

type FilterType = "all" | "unread" | "rental" | "request" | "listing" | "payment";

export default function NotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const isRtl = locale === "ar";
  const dateLocale = isRtl ? arSA : enUS;
  const queryClient = useQueryClient();

  const { user, isLoading: isAuthLoading } = useAuthGuard();
  const [page, setPage] = useState(1);
  const limit = 15;

  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading: isNotificationsLoading, isFetching } = useNotifications(page, limit);
  const { refetch: refetchUnreadCount } = useUnreadNotificationsCount();

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();

  const rawNotifications = data?.notifications ?? [];
  const meta = data?.meta;

  // Filter notifications by category/read status
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter((n: any) => {
      if (filter === "unread") return !n.isRead;
      if (filter === "all") return true;

      const formatted = formatNotification(n, locale, user?.role);
      return formatted.category === filter;
    });
  }, [rawNotifications, filter, locale, user?.role]);

  // Group notifications into Date Buckets
  const groupedNotifications = useMemo(() => {
    const groups: {
      today: any[];
      yesterday: any[];
      thisWeek: any[];
      earlier: any[];
    } = { today: [], yesterday: [], thisWeek: [], earlier: [] };

    filteredNotifications.forEach((n: any) => {
      const d = new Date(n.createdAt);
      if (isToday(d)) {
        groups.today.push(n);
      } else if (isYesterday(d)) {
        groups.yesterday.push(n);
      } else if (isThisWeek(d)) {
        groups.thisWeek.push(n);
      } else {
        groups.earlier.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const handleNotificationClick = (notification: any) => {
    const formatted = formatNotification(notification, locale, user?.role);
    const navigateTo = formatted.route ? `/${locale}${formatted.route}` : null;

    const navigate = () => {
      if (navigateTo) {
        router.push(navigateTo);
      }
    };

    if (notification.isRead) {
      navigate();
      return;
    }

    // Optimistic Update: Set isRead = true in the notifications query data
    queryClient.setQueryData(["notifications", page, limit], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        notifications: old.notifications.map((n: any) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        ),
      };
    });

    // Optimistic Update: Decrement unread notifications count
    queryClient.setQueryData(["notifications", "unread-count"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        unreadCount: Math.max(0, old.unreadCount - 1),
      };
    });

    markRead.mutate(notification.id, {
      onSuccess: () => {
        refetchUnreadCount();
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        navigate();
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        navigate();
      },
    });
  };

  const handleMarkAllRead = () => {
    queryClient.setQueryData(["notifications", page, limit], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        notifications: old.notifications.map((n: any) => ({ ...n, isRead: true })),
      };
    });

    queryClient.setQueryData(["notifications", "unread-count"], (old: any) => {
      if (!old) return old;
      return { ...old, unreadCount: 0 };
    });

    markAllRead.mutate(undefined, {
      onSuccess: () => {
        refetchUnreadCount();
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast({
          title: isRtl ? "تم تعيين الكل كمقروء" : "Marked all as read",
          description: isRtl ? "تم تحديث جميع الإشعارات بنجاح." : "All notifications marked as read.",
          type: "success",
        });
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "فشل تحديث الإشعارات." : "Failed to mark all as read.",
          type: "error",
        });
      },
    });
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    const targetNotification = rawNotifications.find((n: any) => n.id === id);
    const wasUnread = targetNotification ? !targetNotification.isRead : false;

    queryClient.setQueryData(["notifications", page, limit], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        notifications: old.notifications.filter((n: any) => n.id !== id),
      };
    });

    if (wasUnread) {
      queryClient.setQueryData(["notifications", "unread-count"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
    }

    deleteNotification.mutate(id, {
      onSuccess: () => {
        refetchUnreadCount();
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast({
          title: isRtl ? "تم حذف الإشعار" : "Notification Deleted",
          description: isRtl ? "تم إزالة الإشعار بنجاح." : "Notification was successfully deleted.",
          type: "success",
        });
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "فشل حذف الإشعار." : "Failed to delete notification.",
          type: "error",
        });
      },
    });
  };

  const handleDeleteAll = () => {
    if (!confirm(isRtl ? "هل أنت متأكد من رغبتك في حذف جميع الإشعارات نهائياً؟" : "Are you sure you want to delete all notifications?")) {
      return;
    }

    deleteAllNotifications.mutate(undefined, {
      onSuccess: () => {
        refetchUnreadCount();
        setPage(1);
        toast({
          title: isRtl ? "تم إخلاء الإشعارات" : "Notifications Cleared",
          description: isRtl ? "تم حذف جميع إشعاراتك بنجاح." : "All your notifications have been deleted.",
          type: "success",
        });
      },
      onError: () => {
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "فشل مسح الإشعارات." : "Failed to clear notifications.",
          type: "error",
        });
      },
    });
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  let Layout: any = TenantLayout;
  if (user.role === "landlord") {
    Layout = LandlordLayout;
  } else if (user.role === "admin" || user.role === "super_admin") {
    Layout = AdminLayout;
  }

  const hasUnread = rawNotifications.some((n: any) => !n.isRead);

  const dateSections = [
    { key: "today", titleAr: "اليوم", titleEn: "Today", items: groupedNotifications.today },
    { key: "yesterday", titleAr: "أمس", titleEn: "Yesterday", items: groupedNotifications.yesterday },
    { key: "thisWeek", titleAr: "هذا الأسبوع", titleEn: "This Week", items: groupedNotifications.thisWeek },
    { key: "earlier", titleAr: "أقدم من ذلك", titleEn: "Earlier", items: groupedNotifications.earlier },
  ].filter((section) => section.items.length > 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-cairo">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0EA5E9] to-[#0EA5E9] p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-[#0EA5E9]">
                <Bell size={22} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRtl ? "مركز الإشعارات" : "Notification Center"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl ? "تابع تنبيهات حسابك وتحديثات عقودك وطلباتك." : "Track your account alerts, contracts, and requests."}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {rawNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              {hasUnread && (
                <Button
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 text-xs text-blue-600 border-blue-100 hover:bg-blue-50"
                >
                  {markAllRead.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  {isRtl ? "تعيين الكل كمقروء" : "Mark all read"}
                </Button>
              )}

              <Button
                onClick={handleDeleteAll}
                disabled={deleteAllNotifications.isPending}
                variant="outline"
                size="sm"
                className="rounded-xl flex items-center gap-1.5 text-xs text-red-600 border-red-100 hover:bg-red-50"
              >
                {deleteAllNotifications.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isRtl ? "حذف الكل" : "Delete all"}
              </Button>
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", labelAr: "الكل", labelEn: "All" },
            { key: "unread", labelAr: "غير مقروء", labelEn: "Unread" },
            { key: "rental", labelAr: "عقود وإيجارات", labelEn: "Rentals" },
            { key: "request", labelAr: "طلبات معاينة", labelEn: "Requests" },
            { key: "listing", labelAr: "إعلانات", labelEn: "Listings" },
            { key: "payment", labelAr: "مدفوعات", labelEn: "Payments" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-cairo transition-all shrink-0 border cursor-pointer ${
                filter === tab.key
                  ? "bg-[#0EA5E9] text-white border-[#0EA5E9] shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isRtl ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Content Card with Date Grouping */}
        <Card className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden">
          <CardBody className="p-0">
            {isNotificationsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-slate-500">
                  {isRtl ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                  <BellOff size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {isRtl ? "صندوق الإشعارات فارغ" : "No notifications yet"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {isRtl
                    ? "عندما يحدث أي جديد بخصوص إعلاناتك أو عقودك أو طلباتك، ستظهر التنبيهات هنا مباشرة."
                    : "When something happens regarding your listings, contracts, or requests, notifications will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dateSections.map((section) => (
                  <div key={section.key}>
                    {/* Date Section Header */}
                    <div className="bg-slate-50/70 px-5 py-2.5 border-y border-slate-100">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                        {isRtl ? section.titleAr : section.titleEn}
                      </span>
                    </div>

                    {/* Section Notifications List */}
                    <div className="divide-y divide-slate-100">
                      {section.items.map((notification: any) => {
                        const formatted = formatNotification(notification, locale, user?.role);
                        const IconComponent = ICON_MAP[formatted.iconName] || Bell;
                        const categoryStyle = CATEGORY_STYLES[formatted.category] || CATEGORY_STYLES.system;

                        const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        });

                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`flex items-start gap-4 p-5 transition-all duration-200 cursor-pointer group hover:bg-slate-50 ${
                              !notification.isRead ? "bg-blue-50/30" : ""
                            }`}
                          >
                            {/* Left: Unread indicator & Icon */}
                            <div className="flex-shrink-0 flex items-center gap-3">
                              <div
                                className={`w-2.5 h-2.5 rounded-full bg-blue-600 transition-opacity duration-200 shrink-0 ${
                                  notification.isRead ? "opacity-0" : "opacity-100"
                                }`}
                              />
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${categoryStyle.bg} ${categoryStyle.text}`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                            </div>

                            {/* Middle: Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryStyle.bg} ${categoryStyle.text}`}>
                                  {isRtl ? categoryStyle.labelAr : categoryStyle.labelEn}
                                </span>
                                <h2
                                  className={`text-sm truncate ${
                                    !notification.isRead ? "text-slate-900 font-extrabold" : "text-slate-800 font-semibold"
                                  }`}
                                >
                                  {formatted.title}
                                </h2>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed">
                                {formatted.body}
                              </p>

                              <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {timeAgo}
                                </span>

                                {formatted.route && (
                                  <span className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                                    <ExternalLink size={11} />
                                    {isRtl ? "انتقال للتفاصيل" : "Go to details"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: Delete Action */}
                            <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                disabled={deleteNotification.isPending && deleteNotification.variables === notification.id}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                title={isRtl ? "حذف" : "Delete"}
                              >
                                {deleteNotification.isPending && deleteNotification.variables === notification.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="rounded-xl flex items-center gap-1 text-xs"
            >
              <ChevronRight size={15} className={isRtl ? "" : "rotate-180"} />
              {isRtl ? "السابق" : "Previous"}
            </Button>

            <span className="text-xs text-slate-500 font-bold">
              {isRtl
                ? `صفحة ${page} من ${meta.lastPage}`
                : `Page ${page} of ${meta.lastPage}`}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page === meta.lastPage || isFetching}
              onClick={() => setPage((p) => Math.min(p + 1, meta.lastPage))}
              className="rounded-xl flex items-center gap-1 text-xs"
            >
              {isRtl ? "التالي" : "Next"}
              <ChevronLeft size={15} className={isRtl ? "" : "rotate-180"} />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
