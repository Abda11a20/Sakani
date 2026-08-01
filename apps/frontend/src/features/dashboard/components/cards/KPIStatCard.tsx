// apps/frontend/src/components/dashboard/cards/KPIStatCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";

interface KPIStatCardProps {
  title: string;
  value: number | string;
  context?: string;
  icon: LucideIcon;
  colorTheme?: "gold" | "rose" | "warm";
  route?: string;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title, value, context, icon: Icon, route,
}) => {
  const inner = (
    <Card
      variant="default"
      className={`p-3.5 flex flex-row items-center gap-3 transition-all bg-surface border-border ${
        route ? "hover:shadow-md cursor-pointer active:scale-[0.99]" : ""
      }`}
    >
      <div className="p-2.5 rounded-lg shrink-0 bg-accent text-white shadow-xs">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-text-secondary leading-tight font-cairo line-clamp-2">
          {title}
        </p>
        <p className="text-2xl font-extrabold tabular-nums leading-tight mt-0.5 text-text">
          {value}
        </p>
        {context && (
          <p className="text-[10px] font-cairo leading-tight mt-0.5 truncate text-text-tertiary">
            {context}
          </p>
        )}
      </div>
    </Card>
  );

  return route ? <Link href={route}>{inner}</Link> : inner;
};
