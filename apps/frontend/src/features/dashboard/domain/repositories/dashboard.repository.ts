// apps/frontend/src/features/dashboard/domain/repositories/dashboard.repository.ts
import type { DashboardSummaryResponse } from "../../components/types/dashboard.types";

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummaryResponse>;
  getLandlordStats(): Promise<any>;
  getTenantStats(): Promise<any>;
}
