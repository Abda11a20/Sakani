// apps/frontend/src/components/ui/badge.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
        gold: "bg-yellow-50 text-gold dark:bg-yellow-900/20 dark:text-yellow-500 border border-gold/30",
        gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600",
        default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeColor = "success" | "warning" | "danger" | "info" | "gray" | "gold" | "default";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** color هو alias لـ variant — يُفيد عند الاستخدام مع LISTING_STATUS_CONFIG */
  color?: BadgeColor;
}

export function Badge({ className, variant, color, ...props }: BadgeProps) {
  // color يُقدَّم على variant إذا كانا معاً — backward compat
  const resolvedVariant = (color ?? variant) as VariantProps<typeof badgeVariants>["variant"];
  return <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />;
}
