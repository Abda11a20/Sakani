// apps/frontend/src/components/dashboard/sections/ActivitySection.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useNotifications } from "@/hooks/useNotifications";
import { formatNotification } from "@/lib/utils/notification-formatter";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  Bell, FileText, Building2, UserCheck,
  AlertTriangle, CheckCircle2, ArrowLeft, ArrowRight, Clock,
} from "lucide-react";
import { EmptyCard } from "../cards/EmptyCard";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";

interface ActivitySectionProps {
  userRole?: string;
  limit?: number;
}

function pickStyle(n: { eventKey?: string | null; title?: string | null }) {
  const k = (n.eventKey ?? "").toLowerCase();
  const t = (n.title ?? "").toLowerCase();

  // Urgent/contracts
  if (k.includes("contract") || t.includes("عقد"))
    return { Icon: FileText, bg: "bg-status-danger/10", fg: "text-status-danger", dot: "bg-status-danger" };
  if (k.includes("alert") || t.includes("تنبيه"))
    return { Icon: AlertTriangle, bg: "bg-status-danger/10", fg: "text-status-danger", dot: "bg-status-danger" };

  // Listings/requests
  if (k.includes("listing") || t.includes("إعلان"))
    return { Icon: Building2, bg: "bg-accent/10", fg: "text-accent", dot: "bg-accent" };
  if (k.includes("request") || t.includes("طلب"))
    return { Icon: UserCheck, bg: "bg-accent/10", fg: "text-accent", dot: "bg-accent" };

  // Approvals/generic
  if (k.includes("approved") || t.includes("وافق"))
    return { Icon: CheckCircle2, bg: "bg-surface-tertiary", fg: "text-text-secondary", dot: "bg-text-tertiary" };
  return { Icon: Bell, bg: "bg-surface-tertiary", fg: "text-text-tertiary", dot: "bg-border" };
}

function groupLabel(date: Date, isAr: boolean): string {
  if (isToday(date)) return isAr ? "اليوم" : "Today";
  if (isYesterday(date)) return isAr ? "أمس" : "Yesterday";
  return format(date, "dd MMMM", { locale: isAr ? arSA : enUS });
}

function groupByDate(items: Notification[]) {
  const map = new Map<string, Notification[]>();
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const key = isToday(d) ? "__today__" : isYesterday(d) ? "__yesterday__" : format(d, "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ userRole, limit = 6 }) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const router = useRouter();

  const { data, isLoading } = useNotifications(1, limit);
  const notifications = data?.notifications ?? [];
  const groups = groupByDate(notifications);

  return (
    <div className="space-y-2 font-cairo">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {isAr ? "آخر النشاطات" : "Recent Activity"}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/notifications`}
          className="text-xs font-bold text-accent flex items-center gap-1 transition-colors hover:opacity-80"
        >
          {isAr ? "عرض الكل" : "View All"}
          <Arrow className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Skeleton */}
      {isLoading ? (
        <div className="bg-surface rounded-xl border border-border divide-y divide-border-subtle animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3.5">
              <div className="w-8 h-8 rounded-lg bg-surface-tertiary shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-3 bg-surface-tertiary rounded w-2/3" />
                <div className="h-3 bg-surface-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyCard
          title={isAr ? "لا توجد نشاطات" : "No Recent Activity"}
          description={isAr ? "ستظهر الأحداث والتنبيهات هنا فور وقوعها." : "Events will appear here as they occur."}
          icon={Bell}
          actionText={isAr ? "عرض الإشعارات" : "View Notifications"}
          actionRoute="/dashboard/notifications"
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
          {groups.map(({ key, items: grpItems }, gi) => {
            const firstDate = new Date(grpItems[0]?.createdAt ?? Date.now());
            const dateLabel =
              key === "__today__" ? (isAr ? "اليوم" : "Today") :
                key === "__yesterday__" ? (isAr ? "أمس" : "Yesterday") :
                  groupLabel(firstDate, isAr);

            return (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-secondary border-b border-border">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent font-cairo">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>

                <div className="divide-y divide-border-subtle">
                  {grpItems.map((item) => {
                    const formatted = formatNotification(item, locale, userRole);
                    const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                      locale: isAr ? arSA : enUS,
                    });
                    const { Icon, bg, fg, dot } = pickStyle(item);
                    const isUnread = !item.isRead;

                    return (
                      <div
                        key={item.id}
                        onClick={() => { if (formatted.route) router.push(formatted.route); }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-secondary transition-colors ${
                          isUnread ? "bg-accent/5" : ""
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${bg} ${fg}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-text leading-snug font-cairo line-clamp-1">
                              {formatted.title}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUnread && (
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                              )}
                              <span className="text-[10px] text-text-tertiary font-sans whitespace-nowrap">
                                {timeAgo}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed font-cairo">
                            {formatted.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="border-t border-border px-4 py-2.5 bg-surface-secondary">
            <Link
              href={`/${locale}/dashboard/notifications`}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent transition-colors hover:opacity-80"
            >
              {isAr ? "عرض جميع الإشعارات" : "View All Notifications"}
              <Arrow className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
