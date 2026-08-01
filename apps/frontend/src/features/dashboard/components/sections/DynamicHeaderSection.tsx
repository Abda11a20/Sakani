// apps/frontend/src/components/dashboard/sections/DynamicHeaderSection.tsx
// Informative header: greeting + live today's summary list — no refresh button

"use client";

import React from "react";
import { useLocale } from "next-intl";
import { getGreetingText } from "../rules/shared.rules";
import type { UrgentItem, QuickActionKey } from "../types/dashboard.types";

interface DynamicHeaderSectionProps {
  userName?: string;
  lastUpdatedAt?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  urgentItems?: UrgentItem[];
  quickActions?: QuickActionKey[];
}

export const DynamicHeaderSection: React.FC<DynamicHeaderSectionProps> = ({
  userName = "",
  urgentItems = [],
}) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { greeting } = getGreetingText(userName, isAr);

  const urgentContracts = urgentItems.filter((i) => i.type === "CONTRACT_EXPIRING").length;
  const pendingRequests = urgentItems.filter((i) => i.type === "VIEWING_REQUEST_PENDING").length;
  const activeListings = urgentItems.filter((i) => i.type === "LISTING_UNAPPROVED").length;
  const allClear = urgentItems.length === 0;

  // Build today's summary bullets
  const bullets: { emoji: string; text: string; color: string }[] = [];
  if (urgentContracts > 0)
    bullets.push({ emoji: "🔴", text: isAr ? `${urgentContracts} عقد يحتاج مراجعة` : `${urgentContracts} contract needs review`, color: "text-rose-200" });
  if (pendingRequests > 0)
    bullets.push({ emoji: "🟠", text: isAr ? `${pendingRequests} طلب معاينة جديد` : `${pendingRequests} new viewing request`, color: "text-amber-200" });
  if (activeListings > 0)
    bullets.push({ emoji: "🟡", text: isAr ? `${activeListings} إعلان بانتظار الموافقة` : `${activeListings} listing pending approval`, color: "text-amber-100" });
  if (allClear)
    bullets.push({ emoji: "🟢", text: isAr ? "كل شيء على ما يرام اليوم" : "Everything is clear today", color: "text-green-200" });

  return (
    <div
      className="px-5 py-4 rounded-2xl bg-gradient-to-br from-[#0F1A2E] via-[#142E54] to-[#1B4F8A] text-white border border-white/15 shadow-sm"
    >
      {/* Greeting */}
      <p className="text-sm sm:text-base font-extrabold text-white font-cairo">
        {greeting}
      </p>

      {/* Today's summary */}
      <p className="text-[11px] text-amber-200/70 font-cairo mt-0.5 mb-2">
        {isAr ? "لديك اليوم:" : "Today you have:"}
      </p>

      <ul className="space-y-0.5">
        {bullets.map((b, i) => (
          <li key={i} className={`flex items-center gap-1.5 text-[11px] font-semibold font-cairo ${b.color}`}>
            <span className="text-xs leading-none">{b.emoji}</span>
            {b.text}
          </li>
        ))}
      </ul>
    </div>
  );
};
