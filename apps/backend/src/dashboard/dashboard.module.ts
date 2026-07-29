// apps/backend/src/dashboard/dashboard.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardStatsProvider } from './providers/stats.provider';
import { DashboardUrgentProvider } from './providers/urgent.provider';
import { DashboardRecommendationProvider } from './providers/recommendation.provider';
import { DashboardQuickActionsProvider } from './providers/quick-actions.provider';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardStatsProvider,
    DashboardUrgentProvider,
    DashboardRecommendationProvider,
    DashboardQuickActionsProvider,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
