// apps/frontend/src/components/ui/badge.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-status-success/15 text-status-success border border-status-success/30",
        warning: "bg-status-warning/15 text-status-warning border border-status-warning/30",
        danger: "bg-status-danger/15 text-status-danger border border-status-danger/30",
        info: "bg-status-info/15 text-status-info border border-status-info/30",
        gold: "bg-accent/15 text-accent-dark border border-accent/40",
        primary: "bg-primary/10 text-primary border border-primary/20",
        gray: "bg-surface-tertiary text-text-secondary border border-border",
        default: "bg-surface-tertiary text-text-secondary border border-border",
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
