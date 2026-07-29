// apps/frontend/src/components/dashboard/cards/MobileCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

export interface MobileCardActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "danger" | "secondary" | "outline";
  isLoading?: boolean;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "danger" | "info" | "neutral";
  };
  details?: { label: string; value: string }[];
  icon?: LucideIcon;
  actions?: MobileCardActionButton[];
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  badge,
  details = [],
  icon: Icon,
  actions = [],
}) => {
  return (
    <Card className="p-4 bg-surface rounded-2xl border-border shadow-xs space-y-3.5">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-surface-secondary text-text-secondary rounded-xl border border-border shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-text line-clamp-1">{title}</h4>
            {subtitle && <p className="text-xs text-text-secondary line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        {badge && (
          <Badge
            color={badge.variant === "neutral" ? "gray" : badge.variant}
            className="shrink-0"
          >
            {badge.text}
          </Badge>
        )}
      </div>

      {/* Details Grid */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-tertiary rounded-xl text-xs">
          {details.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-text-tertiary block text-[10px]">{item.label}</span>
              <span className="font-semibold text-text block truncate">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-divider">
          {actions.map((act, idx) => {
            const variantMap = {
              primary: "primary",
              danger: "danger",
              secondary: "secondary",
              outline: "outline",
            } as const;

            if (act.href) {
              return (
                <Link key={idx} href={act.href} className="flex-1">
                  <Button
                    variant={variantMap[act.variant || "secondary"]}
                    size="sm"
                    fullWidth
                  >
                    {act.label}
                  </Button>
                </Link>
              );
            }

            return (
              <Button
                key={idx}
                variant={variantMap[act.variant || "secondary"]}
                size="sm"
                fullWidth
                onClick={act.onClick}
                loading={act.isLoading}
              >
                {act.label}
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
};
