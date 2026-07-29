// apps/frontend/src/features/dashboard/index.ts
/**
 * Dashboard Feature — Public API Barrel Export (Clean Architecture)
 */
export * from "./domain/repositories/dashboard.repository";
export * from "./domain/usecases/get-dashboard-summary.usecase";
export * from "./infrastructure/repositories/axios-dashboard.repository";
export * from "./components/hooks/useDashboardSummary";
export * from "./components/types/dashboard.types";
export * from "./components/ActivityFeed";
export * from "./components/ListingForm";
export * from "./components/StatsCard";
export * from "./components/cards/EmptyCard";
export * from "./components/cards/KPIStatCard";
export * from "./components/cards/MobileCard";
export * from "./components/sections/DynamicHeaderSection";
export * from "./components/sections/UrgentBannerSection";
export * from "./components/sections/QuickActionsSection";
export * from "./components/sections/StatsSection";
export * from "./components/sections/ActivitySection";
export * from "./components/sections/RecommendationsSection";
export * from "./components/rules/admin.rules";
export * from "./components/rules/landlord.rules";
export * from "./components/rules/tenant.rules";
export * from "./components/rules/shared.rules";
