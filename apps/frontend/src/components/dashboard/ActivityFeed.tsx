// apps/frontend/src/components/dashboard/ActivityFeed.tsx
"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  date: Date | string;
  icon: React.ComponentType<any>;
  color: string;
  badge?: {
    text: string;
    variant: "warning" | "success" | "danger" | "info" | "default";
  };
  link?: string;
}

interface ActivityFeedProps {
  title: string;
  items: ActivityItem[];
  isLoading?: boolean;
  emptyText?: string;
}

const badgeVariants = {
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold",
  success: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-bold",
  danger: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 font-bold",
  default: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400",
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title,
  items,
  isLoading,
  emptyText = "لا توجد نشاطات حديثة",
}) => {
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-white font-cairo">
          {title}
        </h3>
      </div>
      <div className="p-3 flex-1">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400 font-cairo">
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-cairo">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      item.color
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white font-cairo truncate">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-cairo mt-1">
                      {formatDistanceToNow(new Date(item.date), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                  {item.badge && (
                    <Badge className={cn("text-[10px] px-2 py-0.5 rounded-full font-cairo", badgeVariants[item.badge.variant])}>
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default ActivityFeed;
