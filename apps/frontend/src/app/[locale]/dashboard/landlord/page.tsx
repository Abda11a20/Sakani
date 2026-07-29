// apps/frontend/src/app/[locale]/dashboard/landlord/page.tsx
"use client";

import React from "react";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/features/auth";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Spinner } from "@/components/ui";

import { useDashboardSummary } from "@/features/dashboard";
import { DynamicHeaderSection } from "@/features/dashboard";
import { UrgentBannerSection } from "@/features/dashboard";
import { QuickActionsSection } from "@/features/dashboard";
import { StatsSection } from "@/features/dashboard";
import { ActivitySection } from "@/features/dashboard";
import { RecommendationsSection } from "@/features/dashboard";
import { EmptyCard } from "@/features/dashboard";
import type { QuickActionKey } from "@/features/dashboard";
import { Building2 } from "lucide-react";

/**
 * Static shortcuts always shown regardless of account state.
 * Placed AFTER dynamic actions from the API.
 */
const LANDLORD_STATIC_ACTIONS: QuickActionKey[] = [
  "MANAGE_LISTINGS",
  "MANAGE_CONTRACTS",
  "VIEW_REQUESTS",
  "VIEW_RENTAL_HISTORY",
];

export default function LandlordDashboard() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["landlord"] });

  const {
    data: summary,
    isLoading: isSummaryLoading,
  } = useDashboardSummary("landlord");

  const isLoading = isAuthLoading || (isSummaryLoading && !summary);

  const urgentItems     = summary?.urgent          ?? [];
  const recommendations = summary?.recommendations ?? [];
  const stats           = summary?.stats           ?? {};

  // Merge: dynamic API actions first (state-based), then always-visible shortcuts
  // Deduplicate so a key doesn't appear twice
  const dynamicActions: QuickActionKey[] = summary?.quickActions ?? [];
  const quickActions: QuickActionKey[] = [
    ...dynamicActions,
    ...LANDLORD_STATIC_ACTIONS.filter((k) => !dynamicActions.includes(k)),
  ];

  if (isLoading || !user) {
    return (
      <LandlordLayout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      {/*
       * Priority layout (Landlord) — Plan §Phase 2:
       * 1. DynamicHeaderSection  — greeting + today's live status
       * 2. UrgentBannerSection   — 🔴 expiring leases · 🟠 pending requests
       * 3. QuickActionsSection   — dynamic (state) + static shortcuts, merged
       * 4. StatsSection          — 4 KPI cards (2-col grid)
       * 5. ActivitySection       — notification timeline
       * 6. RecommendationsSection — smart tips at bottom
       */}
      <div className="space-y-5" dir={locale === "ar" ? "rtl" : "ltr"}>

        <DynamicHeaderSection
          userName={user.name}
          urgentItems={urgentItems}
        />

        {/* ② Urgent Banners */}
        <UrgentBannerSection items={urgentItems} />

        {/* ③ Quick Actions — dynamic + static merged */}
        <QuickActionsSection actionKeys={quickActions} role="landlord" />

        {/* ④ KPI Stats — or New User EmptyState */}
        {(stats.activeListings ?? 0) === 0 && !isSummaryLoading ? (
          <EmptyCard
            title={locale === "ar" ? "🏠 ليس لديك أي إعلان بعد" : "🏠 No listings yet"}
            description={
              locale === "ar"
                ? "أنشئ أول إعلانك الآن وابدأ في استقبال طلبات المستأجرين فوراً."
                : "Create your first listing now and start receiving tenant requests."
            }
            icon={Building2}
            actionText={locale === "ar" ? "أنشئ أول إعلان" : "Create First Listing"}
            actionRoute="/dashboard/landlord/advertisements/new"
          />
        ) : (
          <StatsSection stats={stats} role="landlord" />
        )}

        {/* ⑤ Activity Timeline */}
        <ActivitySection userRole="landlord" limit={6} />

        {/* ⑥ Recommendations */}
        <RecommendationsSection items={recommendations} />

      </div>
    </LandlordLayout>
  );
}
