// apps/frontend/src/features/dashboard/infrastructure/repositories/axios-dashboard.repository.ts
import { api } from "@/lib/api";
import { IDashboardRepository } from "../../domain/repositories/dashboard.repository";
import type { DashboardSummaryResponse } from "../../components/types/dashboard.types";

export class AxiosDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const res = await api.get<DashboardSummaryResponse>("/dashboard/summary");
    return res.data;
  }

  async getLandlordStats(): Promise<any> {
    const res = await api.get("/dashboard/landlord/stats");
    return res.data;
  }

  async getTenantStats(): Promise<any> {
    const res = await api.get("/dashboard/tenant/stats");
    return res.data;
  }
}

export const dashboardRepository = new AxiosDashboardRepository();
