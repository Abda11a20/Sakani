// apps/frontend/src/components/dashboard/sections/UrgentBannerSection.tsx
// High severity = Rose #C9637A · Medium = Gold #D4A847

import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Inbox, ArrowLeft, ArrowRight } from "lucide-react";
import type { UrgentItem } from "../types/dashboard.types";
import { useLocale, useTranslations } from "next-intl";

function severityLabel(s: UrgentItem["severity"], isAr: boolean, tUrgent: any) {
  if (s === "high") return tUrgent("urgent");
  if (s === "medium") return tUrgent("notice");
  return tUrgent("info");
}

function getLocalizedUrgentTitle(type: UrgentItem["type"], defaultTitle: string, isAr: boolean): string {
  if (isAr) return defaultTitle;
  switch (type) {
    case "CONTRACT_EXPIRING": return "Lease Contract Expiring Soon";
    case "VIEWING_REQUEST_PENDING": return "New Viewing Request Pending";
    case "REQUEST_ACCEPTED": return "Viewing Request Accepted";
    case "LISTING_UNAPPROVED": return "New Listings Awaiting Review";
    default: return defaultTitle;
  }
}

export const UrgentBannerSection: React.FC<{ items: UrgentItem[] }> = ({ items }) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tUrgent = useTranslations("dashboard.landlord.urgent");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-cairo">
        {tUrgent("needsAction")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const isHigh = item.severity === "high";
          const Icon = item.type === "CONTRACT_EXPIRING" ? AlertTriangle
            : item.type === "LISTING_UNAPPROVED" || item.type === "LISTING_PAUSED" ? Clock
              : Inbox;

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
                    {getLocalizedUrgentTitle(item.type, item.title, isAr)}
                  </h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${labelClr}`}>
                    {severityLabel(item.severity, isAr, tUrgent)}
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
                    {tUrgent("takeAction")}
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
