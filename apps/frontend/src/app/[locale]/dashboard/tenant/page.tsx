// apps/frontend/src/app/[locale]/dashboard/tenant/page.tsx
"use client";

import React from "react";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/features/auth";
import TenantLayout from "@/components/layout/TenantLayout";
import { Spinner } from "@/components/ui";

import { useDashboardSummary } from "@/features/dashboard";
import { DynamicHeaderSection } from "@/features/dashboard";
import { UrgentBannerSection } from "@/features/dashboard";
import { QuickActionsSection } from "@/features/dashboard";
import { StatsSection } from "@/features/dashboard";
import { ActivitySection } from "@/features/dashboard";
import { RecommendationsSection } from "@/features/dashboard";
import type { QuickActionKey } from "@/features/dashboard";

/**
 * Always-visible tenant shortcuts — never empty-handed even if API
 * returns no dynamic actions yet (new account with no requests).
 */
const TENANT_STATIC_ACTIONS: QuickActionKey[] = [
  "SEARCH_HOUSING",
  "CREATE_SMART_ALERT",
  "VIEW_MY_REQUESTS",
  "VIEW_RENTAL_HISTORY",
];

export default function TenantDashboard() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant"] });

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching,
    refetch,
  } = useDashboardSummary("tenant");

  const isLoading = isAuthLoading || (isSummaryLoading && !summary);

  const urgentItems = summary?.urgent ?? [];
  const recommendations = summary?.recommendations ?? [];
  const stats = summary?.stats ?? {};

  // Merge dynamic (state-based from API) with static shortcuts — deduplicated
  const dynamicActions: QuickActionKey[] = summary?.quickActions ?? [];
  const quickActions: QuickActionKey[] = [
    ...dynamicActions,
    ...TENANT_STATIC_ACTIONS.filter((k) => !dynamicActions.includes(k)),
  ];

  if (isLoading || !user) {
    return (
      <TenantLayout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      {/*
       * Priority layout (Tenant) — Plan §Phase 3:
       * 1. DynamicHeaderSection   — greeting + today's live status
       * 2. UrgentBannerSection    — accepted requests / appointment alerts
       * 3. QuickActionsSection    — dynamic + static shortcuts merged
       * 4. StatsSection           — 4 KPI cards
       * 5. ActivitySection        — notification timeline
       * 6. RecommendationsSection — smart tips at bottom
       */}
      <div className="space-y-5" dir={locale === "ar" ? "rtl" : "ltr"}>

        {/* ① Header */}
        <DynamicHeaderSection
          userName={user.name}
          lastUpdatedAt={summary?.lastUpdatedAt}
          onRefresh={refetch}
          isRefreshing={isFetching}
          urgentItems={urgentItems}
          quickActions={quickActions}
        />

        {/* ② Urgent Banners */}
        <UrgentBannerSection items={urgentItems} />

        {/* ③ Quick Actions — dynamic + static merged */}
        <QuickActionsSection actionKeys={quickActions} role="tenant" />

        {/* ④ KPI Stats */}
        <StatsSection stats={stats} role="tenant" />

        {/* ⑤ Activity Timeline */}
        <ActivitySection userRole="tenant" limit={6} />

        {/* ⑥ Recommendations */}
        <RecommendationsSection items={recommendations} />

      </div>
    </TenantLayout>
  );
}
