// apps/frontend/src/components/dashboard/StatsCard.tsx
"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";

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
  blue:   { bg: "bg-primary/10",      icon: "text-primary"   },
  green:  { bg: "bg-status-success/10", icon: "text-status-success" },
  yellow: { bg: "bg-status-warning/10", icon: "text-status-warning" },
  red:    { bg: "bg-status-danger/10",  icon: "text-status-danger" },
  gold:   { bg: "bg-accent/20",       icon: "text-accent"  },
  purple: { bg: "bg-purple-500/10",   icon: "text-purple-600" },
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
    <Card
      variant="default"
      className={cn(
        "relative flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-surface border-border",
        className
      )}
    >
      {/* Icon */}
      <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
        <span className={cn("h-5 w-5 sm:h-6 sm:w-6", cfg.icon)}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-text-secondary leading-tight break-words font-cairo">{title}</p>
        <p className="mt-0.5 text-xl sm:text-2xl font-extrabold text-text leading-none">{displayedValue}</p>
        {subtitle && (
          <p className="mt-1 text-[10px] sm:text-xs text-text-tertiary leading-normal break-words font-cairo">{subtitle}</p>
        )}
      </div>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="absolute end-2 top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-status-danger text-[8px] sm:text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Card>
  );
};

export default StatsCard;
