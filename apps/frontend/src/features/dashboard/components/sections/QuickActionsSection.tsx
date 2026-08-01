// apps/frontend/src/components/dashboard/sections/QuickActionsSection.tsx
// Primary = Gold · Accent = Rose · Secondary = warm outlined

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { QuickActionKey, FormattedQuickAction } from "../types/dashboard.types";
import { mapLandlordQuickAction } from "../rules/landlord.rules";
import { mapTenantQuickAction } from "../rules/tenant.rules";
import { mapAdminQuickAction } from "../rules/admin.rules";
import {
  Plus, FileText, UserCheck, Search, Bell, CheckCircle2, ShieldAlert,
  Building2, ClipboardList, History, RefreshCw, Home,
} from "lucide-react";

interface QuickActionsSectionProps {
  actionKeys: QuickActionKey[];
  role: "landlord" | "tenant" | "admin";
}

const ICON_MAP: Record<string, React.ElementType> = {
  Plus, FileText, UserCheck, Search, Bell, CheckCircle2, ShieldAlert,
  Building2, ClipboardList, History, RefreshCw, Home,
};

function sortByPriority(actions: FormattedQuickAction[]): FormattedQuickAction[] {
  const order: Record<FormattedQuickAction["variant"], number> = { primary: 0, accent: 1, secondary: 2 };
  return [...actions].sort((a, b) => order[a.variant] - order[b.variant]);
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  actionKeys, role,
}) => {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (!actionKeys || actionKeys.length === 0) return null;

  const rawActions = actionKeys.map((key) => {
    if (role === "landlord") return mapLandlordQuickAction(key, isAr);
    if (role === "tenant") return mapTenantQuickAction(key, isAr);
    return mapAdminQuickAction(key, isAr);
  });

  const actions = sortByPriority(rawActions);

  return (
    <div className="space-y-2 font-cairo">
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
        {isAr ? "إجراءات سريعة" : "Quick Actions"}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {actions.map((act) => {
          const Icon = ICON_MAP[act.iconName] || Plus;

          // Primary — Accent Gold filled, dark text
          if (act.variant === "primary") {
            return (
              <Link
                key={act.key}
                href={`/${locale}${act.route}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold bg-accent text-text hover:bg-accent-hover active:scale-[0.98] shadow-xs transition-all cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold leading-tight font-cairo truncate">
                  {act.title}
                </span>
              </Link>
            );
          }

          // Accent — Brand Primary filled, white text
          if (act.variant === "accent") {
            return (
              <Link
                key={act.key}
                href={`/${locale}${act.route}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] shadow-xs transition-all cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold leading-tight font-cairo truncate">
                  {act.title}
                </span>
              </Link>
            );
          }

          // Secondary — Outlined surface card
          return (
            <Link
              key={act.key}
              href={`/${locale}${act.route}`}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-primary hover:bg-surface-secondary active:scale-[0.98] transition-all cursor-pointer"
            >
              <Icon className="w-4 h-4 shrink-0 text-text-tertiary group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold leading-tight font-cairo truncate">
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
