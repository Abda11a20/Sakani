// apps/frontend/src/components/dashboard/cards/EmptyCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, Inbox } from "lucide-react";
import { useLocale } from "next-intl";
import { Button, Card } from "@/components/ui";

interface EmptyCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionRoute?: string;
  onActionClick?: () => void;
  colorTheme?: "gold" | "rose";
}

export const EmptyCard: React.FC<EmptyCardProps> = ({
  title, description, icon: Icon = Inbox,
  actionText, actionRoute, onActionClick,
  colorTheme = "gold",
}) => {
  const locale = useLocale();

  const ctaNode = actionText && actionRoute ? (
    <Link href={`/${locale}${actionRoute}`}>
      <Button variant={colorTheme === "rose" ? "danger" : "accent"} size="sm">
        {actionText}
      </Button>
    </Link>
  ) : actionText && onActionClick ? (
    <Button
      variant={colorTheme === "rose" ? "danger" : "accent"}
      size="sm"
      onClick={onActionClick}
    >
      {actionText}
    </Button>
  ) : null;

  return (
    <Card className="py-8 px-4 text-center flex flex-col items-center gap-3 bg-surface-secondary border-border">
      <div className="p-3.5 rounded-xl bg-accent/20 text-accent shadow-xs">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-bold text-text font-cairo">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed font-cairo">{description}</p>
      </div>
      {ctaNode}
    </Card>
  );
};
