// apps/frontend/src/components/ui/badge.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 border border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        danger: "bg-red-100 text-red-800 border border-red-200",
        info: "bg-blue-100 text-blue-800 border border-blue-200",
        gold: "bg-yellow-50 text-gold border border-gold/30",
        gray: "bg-gray-100 text-gray-800 border border-gray-200",
        default: "bg-gray-100 text-gray-800",
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
