// apps/backend/src/dashboard/dashboard.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get unified dashboard summary for current user role',
  })
  async getSummary(@CurrentUser() user: SafeUser) {
    return this.dashboardService.getSummary(user.id, user.role);
  }

  @Get('landlord/stats')
  @Roles(UserRole.landlord)
  async getLandlordStats(@CurrentUser() user: SafeUser) {
    return this.dashboardService.getLandlordStats(user.id);
  }

  @Get('tenant/stats')
  @Roles(UserRole.tenant)
  async getTenantStats(@CurrentUser() user: SafeUser) {
    return this.dashboardService.getTenantStats(user.id);
  }
}
