// apps/frontend/src/components/dashboard/sections/UrgentBannerSection.tsx
// High severity = Rose #C9637A · Medium = Gold #D4A847

import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Inbox, ArrowLeft, ArrowRight } from "lucide-react";
import type { UrgentItem } from "../types/dashboard.types";
import { useLocale } from "next-intl";

function severityLabel(s: UrgentItem["severity"], ar: boolean) {
  if (s === "high") return ar ? "عاجل" : "Urgent";
  if (s === "medium") return ar ? "تنبيه" : "Notice";
  return ar ? "تذكير" : "Info";
}

export const UrgentBannerSection: React.FC<{ items: UrgentItem[] }> = ({ items }) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-cairo">
        {isAr ? "تحتاج إجراءً" : "Needs Action"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const isHigh = item.severity === "high";
          const Icon = item.type === "CONTRACT_EXPIRING" ? AlertTriangle
            : item.type === "LISTING_UNAPPROVED" || item.type === "LISTING_PAUSED" ? Clock
              : Inbox;

          // High = Status Danger · Medium/Info = Accent Gold
          const iconBg = isHigh ? "bg-status-danger" : "bg-accent";
          const cardBg = isHigh ? "bg-status-danger/10 border-status-danger/30" : "bg-accent/10 border-accent/30";
          const btnBg = isHigh ? "bg-status-danger text-white hover:bg-status-danger/90" : "bg-accent text-text hover:bg-accent-hover";
          const labelClr = isHigh ? "text-status-danger" : "text-accent-active";

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${cardBg}`}
            >
              <div className={`p-2 rounded-lg shrink-0 text-white ${iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-text leading-snug font-cairo truncate">
                    {item.title}
                  </h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${labelClr}`}>
                    {severityLabel(item.severity, isAr)}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed font-cairo line-clamp-2">
                  {item.description}
                </p>
                {item.route && (
                  <Link
                    href={item.route}
                    className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all shadow-2xs ${btnBg}`}
                  >
                    {isAr ? "اتخاذ إجراء" : "Take Action"}
                    <Arrow className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
