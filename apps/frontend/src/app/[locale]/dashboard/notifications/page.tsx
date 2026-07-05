// apps/frontend/src/app/[locale]/dashboard/notifications/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
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
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Badge,
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

const TYPE_COLORS: Record<string, { bg: string; text: string; labelAr: string; labelEn: string }> = {
  SYSTEM: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", labelAr: "نظام", labelEn: "System" },
  REQUEST: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", labelAr: "طلب معاينة", labelEn: "Viewing Request" },
  REVIEW: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", labelAr: "تقييم", labelEn: "Review" },
  PAYMENT: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", labelAr: "دفع", labelEn: "Payment" },
  CHAT: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", labelAr: "محادثة", labelEn: "Chat" },
  ALERT: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", labelAr: "تنبيه", labelEn: "Alert" },
};

const translateNotification = (title: string, body: string, isRtl: boolean) => {
  if (!isRtl) return { title, body };

  let translatedTitle = title;
  const lowerTitle = title.toLowerCase();

  // Translate Titles
  if (lowerTitle.includes("bed rental completed")) {
    translatedTitle = "تم تأجير السرير بنجاح";
  } else if (lowerTitle.includes("rental completed")) {
    translatedTitle = "تم تأجير الوحدة بنجاح";
  } else if (lowerTitle.includes("new viewing request")) {
    translatedTitle = "طلب معاينة جديد";
  } else if (lowerTitle.includes("viewing request accepted")) {
    translatedTitle = "تم قبول طلب المعاينة";
  } else if (lowerTitle.includes("viewing request rejected")) {
    translatedTitle = "تم رفض طلب المعاينة";
  } else if (lowerTitle.includes("viewing request canceled")) {
    translatedTitle = "تم إلغاء طلب المعاينة";
  } else if (lowerTitle.includes("listing approved")) {
    translatedTitle = "تمت الموافقة على الإعلان";
  } else if (lowerTitle.includes("listing rejected")) {
    translatedTitle = "تم رفض الإعلان";
  } else if (lowerTitle.includes("new message")) {
    translatedTitle = "رسالة جديدة";
  } else if (lowerTitle.includes("password reset successful")) {
    translatedTitle = "تغيير كلمة المرور بنجاح";
  }

  // Translate Body and handle dynamic quoted values
  let translatedBody = body;
  const quoteMatch = body.match(/"([^"]+)"/);
  const propertyName = quoteMatch ? quoteMatch[1] : "";

  const lowerBody = body.toLowerCase();

  if (lowerBody.includes("bed rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName 
      ? `تم إتمام عملية تأجير سرير بنجاح في العقار "${propertyName}".`
      : "تم إتمام عملية تأجير سرير بنجاح.";
  } else if (lowerBody.includes("your bed rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName 
      ? `تم إتمام عملية تأجير سرير لك بنجاح في العقار "${propertyName}".`
      : "تم إتمام عملية تأجير السرير لك بنجاح.";
  } else if (lowerBody.includes("rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName 
      ? `تم إتمام تأجير العقار "${propertyName}" بنجاح.`
      : "تم إتمام تأجير العقار بنجاح.";
  } else if (lowerBody.includes("your rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName 
      ? `تم إتمام عقد إيجار العقار "${propertyName}" الخاص بك بنجاح.`
      : "تم إتمام عقد الإيجار بنجاح.";
  } else if (lowerBody.includes("requested to view")) {
    translatedBody = propertyName 
      ? `قام مستأجر بتقديم طلب معاينة للعقار "${propertyName}".`
      : "قام مستأجر بتقديم طلب معاينة جديد لعقارك.";
  } else if (lowerBody.includes("viewing request for") && lowerBody.includes("accepted")) {
    translatedBody = propertyName 
      ? `تم قبول طلب المعاينة الخاص بك للعقار "${propertyName}" من قبل المؤجر.`
      : "تم قبول طلب المعاينة الخاص بك من قبل المؤجر.";
  } else if (lowerBody.includes("viewing request for") && lowerBody.includes("rejected")) {
    translatedBody = propertyName 
      ? `تم رفض طلب المعاينة الخاص بك للعقار "${propertyName}" من قبل المؤجر.`
      : "تم رفض طلب المعاينة الخاص بك من قبل المؤجر.";
  } else if (lowerBody.includes("canceled their viewing request")) {
    translatedBody = propertyName 
      ? `قام المستأجر بإلغاء طلب المعاينة الخاص به للعقار "${propertyName}".`
      : "قام المستأجر بإلغاء طلب المعاينة للعقار.";
  } else if (lowerBody.includes("has been approved")) {
    translatedBody = propertyName 
      ? `تمت الموافقة على إعلانك "${propertyName}" بنجاح وهو الآن نشط وظاهر بالمنصة.`
      : "تمت الموافقة على إعلانك بنجاح وأصبح ظاهراً بالمنصة.";
  } else if (lowerBody.includes("was rejected")) {
    translatedBody = propertyName 
      ? `تم رفض إعلانك "${propertyName}" من قبل الإدارة.`
      : "تم رفض إعلانك من قبل الإدارة.";
  } else if (lowerBody.includes("received a new message")) {
    translatedBody = "لقد تلقيت رسالة جديدة في الدعم الفني.";
  } else if (lowerBody.includes("password has been successfully reset")) {
    translatedBody = "تم إعادة تعيين كلمة المرور الخاصة بك بنجاح.";
  }

  return { title: translatedTitle, body: translatedBody };
};

export default function NotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const isRtl = locale === "ar";
  const dateLocale = isRtl ? arSA : enUS;

  const { user, isLoading: isAuthLoading } = useAuthGuard();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading: isNotificationsLoading, isFetching, refetch } = useNotifications(page, limit);
  const { refetch: refetchUnreadCount } = useUnreadNotificationsCount();

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();

  const notifications = data?.notifications ?? [];
  const meta = data?.meta;

  const handleNotificationClick = (notification: any) => {
    // Determine redirect destination
    let navigateTo = null;
    const isLandlord = user?.role === "landlord";

    if (
      notification.entityType === "listing" ||
      notification.entityType === "listing.approved" ||
      notification.entityType === "listing.rejected"
    ) {
      if (notification.entityId) {
        navigateTo = isLandlord
          ? `/${locale}/dashboard/landlord/advertisements/${notification.entityId}`
          : `/${locale}/listings/${notification.entityId}`;
      }
    } else if (notification.entityType?.startsWith("viewing_request")) {
      navigateTo = isLandlord
        ? `/${locale}/dashboard/landlord/requests`
        : `/${locale}/dashboard/tenant`; // or tenant request page if any
    } else if (notification.type === "CHAT") {
      navigateTo = `/${locale}/dashboard/support`;
    }

    const navigate = () => {
      if (navigateTo) {
        router.push(navigateTo);
      }
    };

    if (notification.isRead) {
      navigate();
      return;
    }

    markRead.mutate(notification.id, {
      onSuccess: () => {
        refetchUnreadCount();
        navigate();
      },
      onError: (err) => {
        console.error("Failed to mark as read:", err);
        navigate(); // Navigate anyway if mark fails
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        refetchUnreadCount();
        toast({
          title: isRtl ? "تم تعيين الكل كمقروء" : "Marked all as read",
          description: isRtl ? "تم تحديث جميع الإشعارات بنجاح." : "All notifications marked as read.",
          type: "success",
        });
      },
      onError: () => {
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
    deleteNotification.mutate(id, {
      onSuccess: () => {
        refetchUnreadCount();
        toast({
          title: isRtl ? "تم حذف الإشعار" : "Notification Deleted",
          description: isRtl ? "تم إزالة الإشعار بنجاح." : "Notification was successfully deleted.",
          type: "success",
        });
      },
      onError: () => {
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

  // Resolve Layout dynamically based on user role
  let Layout: any = TenantLayout;
  if (user.role === "landlord") {
    Layout = LandlordLayout;
  } else if (user.role === "admin" || user.role === "super_admin") {
    Layout = AdminLayout;
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-cairo">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1B4F8A] to-[#D4A847] p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#1B4F8A] dark:text-[#E8C06A]">
                <Bell size={22} className="animate-swing" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {isRtl ? "مركز الإشعارات" : "Notification Center"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl ? "تابع تنبيهات حسابك وتحديثات طلباتك وعقاراتك." : "Track your account alerts, requests, and listings."}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {hasUnread && (
                <Button
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/20"
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
                className="rounded-xl flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 border-red-100 dark:border-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30"
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

        {/* Content Card */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardBody className="p-0">
            {isNotificationsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isRtl ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                  <BellOff size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {isRtl ? "صندوق الإشعارات فارغ" : "No notifications yet"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                  {isRtl
                    ? "عندما يحدث أي جديد بخصوص إعلاناتك أو طلباتك، ستظهر التنبيهات هنا مباشرة."
                    : "When something happens regarding your listings or requests, notifications will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => {
                  const typeInfo = TYPE_COLORS[notification.type] ?? {
                    bg: "bg-slate-100",
                    text: "text-slate-600",
                    labelAr: "تنبيه",
                    labelEn: "Alert",
                  };
                  const typeLabel = isRtl ? typeInfo.labelAr : typeInfo.labelEn;
                  const { title: displayTitle, body: displayBody } = translateNotification(
                    notification.title,
                    notification.body,
                    isRtl
                  );
                  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  });

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-4 p-5 transition-all duration-200 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                        !notification.isRead ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                      }`}
                    >
                      {/* Left: Indicator & Icon wrapper */}
                      <div className="flex-shrink-0 flex items-center gap-3">
                        {/* Unread indicator */}
                        <div
                          className={`w-2 h-2 rounded-full bg-blue-500 transition-opacity duration-200 shrink-0 ${
                            notification.isRead ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        {/* Badge */}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeInfo.bg} ${typeInfo.text}`}>
                          {typeLabel}
                        </span>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm truncate ${
                              !notification.isRead
                                ? "text-slate-900 dark:text-white font-bold"
                                : "text-slate-700 dark:text-slate-350"
                            }`}
                          >
                            {displayTitle}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {displayBody}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {timeAgo}
                          </span>
                          {notification.entityId && (
                            <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline">
                              <ExternalLink size={10} />
                              {isRtl ? "تفاصيل الوجهة" : "Destination details"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          disabled={deleteNotification.isPending && deleteNotification.variables === notification.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          {deleteNotification.isPending && deleteNotification.variables === notification.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
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
            
            <span className="text-xs text-slate-500 dark:text-slate-400">
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
