// apps/frontend/src/components/dashboard/StatsCard.tsx
"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "gold" | "purple";
  badge?: number;
  subtitle?: string;
  className?: string;
  locale?: string;
}

export function formatStatsNumber(num: number, locale: string): string {
  if (num === 0) return "0";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { useGrouping: true }).format(num);
}

const colorConfig: Record<
  StatsCardProps["color"],
  { bg: string; icon: string }
> = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",   icon: "text-blue-600 dark:text-blue-400"   },
  green:  { bg: "bg-green-50 dark:bg-green-900/20",  icon: "text-green-600 dark:text-green-400"  },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/20",icon: "text-yellow-600 dark:text-yellow-400" },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",      icon: "text-red-600 dark:text-red-400"    },
  gold:   { bg: "bg-amber-50 dark:bg-amber-900/20",  icon: "text-amber-600 dark:text-amber-400"  },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20",icon: "text-purple-600 dark:text-purple-400" },
};

export const StatsCard = ({
  title,
  value,
  icon,
  color,
  badge,
  subtitle,
  className,
  locale = "ar",
}: StatsCardProps) => {
  const cfg = colorConfig[color];

  const displayedValue = React.useMemo(() => {
    if (typeof value === "number") {
      return formatStatsNumber(value, locale);
    }
    return value;
  }, [value, locale]);

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 sm:gap-4 rounded-xl border border-gray-100 dark:border-gray-800",
        "bg-white dark:bg-gray-900 p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Icon */}
      <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
        <span className={cn("h-5 w-5 sm:h-6 sm:w-6", cfg.icon)}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight break-words">{title}</p>
        <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none">{displayedValue}</p>
        {subtitle && (
          <p className="mt-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 leading-normal break-words">{subtitle}</p>
        )}
      </div>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="absolute end-2 top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );
};

export default StatsCard;
