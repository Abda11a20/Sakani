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

          // High = Rose · Medium/Info = Gold
          const iconBg = isHigh ? "#C9637A" : "#D4A847";
          const cardBg = isHigh ? "#FFF1F3" : "#FFFBEB";
          const border = isHigh ? "#FECDD3" : "#FDE68A";
          const btnBg = isHigh ? "#C9637A" : "#D4A847";
          const btnText = isHigh ? "#ffffff" : "#0f1a2e";
          const labelClr = isHigh ? "#C9637A" : "#C49535";

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3.5 rounded-xl border"
              style={{ background: cardBg, borderColor: border }}
            >
              <div
                className="p-2 rounded-lg shrink-0 text-white"
                style={{ background: iconBg }}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug font-cairo truncate">
                    {item.title}
                  </h4>
                  <span
                    className="text-[9px] font-black uppercase tracking-widest shrink-0"
                    style={{ color: labelClr }}
                  >
                    {severityLabel(item.severity, isAr)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-cairo line-clamp-2">
                  {item.description}
                </p>
                {item.route && (
                  <Link
                    href={item.route}
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all hover:opacity-90"
                    style={{ background: btnBg, color: btnText }}
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
