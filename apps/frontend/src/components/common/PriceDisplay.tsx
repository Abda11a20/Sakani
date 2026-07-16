// apps/frontend/src/components/common/PriceDisplay.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatters";

interface PriceDisplayProps {
  price: number;
  includesBills?: boolean;
  size?: "sm" | "md" | "lg";
  showPeriod?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<PriceDisplayProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl font-bold",
};

export const PriceDisplay = ({
  price,
  includesBills,
  size = "md",
  showPeriod = true,
  className,
}: PriceDisplayProps) => (
  <div
    className={cn("flex items-center gap-1 flex-wrap", className)}
    style={{ direction: "ltr" }}
  >
    <span className={cn("font-semibold text-primary", sizeClasses[size])}>
      {formatPrice(price)}
    </span>
    {showPeriod && (
      <span className="text-muted-foreground text-sm">/شهر</span>
    )}
    {includesBills && (
      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
        شامل الفواتير
      </span>
    )}
  </div>
);

export default PriceDisplay;
