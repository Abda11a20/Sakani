// apps/frontend/src/features/dashboard/domain/usecases/get-dashboard-summary.usecase.ts
import { dashboardRepository } from "../../infrastructure/repositories/axios-dashboard.repository";
import { IDashboardRepository } from "../repositories/dashboard.repository";
import type { DashboardSummaryResponse } from "../../components/types/dashboard.types";

export class GetDashboardSummaryUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async execute(): Promise<DashboardSummaryResponse> {
    return await this.dashboardRepo.getSummary();
  }
}

export const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dashboardRepository);
