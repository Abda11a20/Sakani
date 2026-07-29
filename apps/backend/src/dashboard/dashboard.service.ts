// apps/backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { DashboardStatsProvider } from './providers/stats.provider';
import { DashboardUrgentProvider } from './providers/urgent.provider';
import { DashboardRecommendationProvider } from './providers/recommendation.provider';
import { DashboardQuickActionsProvider } from './providers/quick-actions.provider';

@Injectable()
export class DashboardService {
  constructor(
    private readonly statsProvider: DashboardStatsProvider,
    private readonly urgentProvider: DashboardUrgentProvider,
    private readonly recommendationProvider: DashboardRecommendationProvider,
    private readonly quickActionsProvider: DashboardQuickActionsProvider,
  ) {}

  async getSummary(userId: string, role: string) {
    const [stats, urgent, recommendations, quickActions] = await Promise.all([
      this.statsProvider.getStats(userId, role),
      this.urgentProvider.getUrgentItems(userId, role),
      this.recommendationProvider.getRecommendations(userId, role),
      this.quickActionsProvider.getQuickActions(userId, role),
    ]);

    return {
      stats,
      urgent,
      recommendations,
      quickActions,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  // Legacy backwards compatibility endpoints
  async getLandlordStats(landlordId: string) {
    return this.statsProvider.getStats(landlordId, 'landlord');
  }

  async getTenantStats(tenantId: string) {
    return this.statsProvider.getStats(tenantId, 'tenant');
  }
}
