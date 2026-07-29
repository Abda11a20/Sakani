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
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-cairo">
        {isAr ? "إجراءات سريعة" : "Quick Actions"}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {actions.map((act) => {
          const Icon = ICON_MAP[act.iconName] || Plus;

          // Primary — Gold filled, dark text
          if (act.variant === "primary") {
            return (
              <Link
                key={act.key}
                href={`/${locale}${act.route}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-sm"
                style={{ background: "#D4A847", color: "#0f1a2e" }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold leading-tight font-cairo truncate">
                  {act.title}
                </span>
              </Link>
            );
          }

          // Accent — Rose filled, white text
          if (act.variant === "accent") {
            return (
              <Link
                key={act.key}
                href={`/${locale}${act.route}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-sm"
                style={{ background: "#C9637A", color: "#ffffff" }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold leading-tight font-cairo truncate">
                  {act.title}
                </span>
              </Link>
            );
          }

          // Secondary — warm cream outlined, gold icon on hover
          return (
            <Link
              key={act.key}
              href={`/${locale}${act.route}`}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98]"
              style={{
                background: "#FDF8F0",
                borderColor: "#EFE0C0",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4A847"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EFE0C0"; }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: "#B8935A" }} />
              <span className="text-xs font-bold leading-tight font-cairo truncate" style={{ color: "#7A5C30" }}>
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
