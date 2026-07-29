// apps/backend/src/rental-history/rental-history.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RentalHistoryService } from './rental-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole, ContractStatus } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Rental History')
@ApiBearerAuth()
@Controller('rental-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalHistoryController {
  constructor(private readonly rentalHistoryService: RentalHistoryService) {}

  /**
   * GET /rental-history/landlord
   * Returns paginated completed rentals for all listings owned by the landlord.
   */
  @Get('landlord')
  @Roles(UserRole.landlord)
  async getLandlordHistory(
    @CurrentUser() user: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: ContractStatus,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.rentalHistoryService.getLandlordHistory(user.id, {
      page,
      limit,
      search,
      from,
      to,
      status,
      sort: sort === 'asc' ? 'asc' : 'desc',
    });
  }

  /**
   * GET /rental-history/tenant
   * Returns paginated completed rentals for the authenticated tenant.
   */
  @Get('tenant')
  @Roles(UserRole.tenant)
  async getTenantHistory(
    @CurrentUser() user: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: ContractStatus,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.rentalHistoryService.getTenantHistory(user.id, {
      page,
      limit,
      search,
      from,
      to,
      status,
      sort: sort === 'asc' ? 'asc' : 'desc',
    });
  }

  /**
   * GET /rental-history/admin
   * Returns paginated completed rentals for all users (accessible by Admin/Super Admin only).
   */
  @Get('admin')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getAdminHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: ContractStatus,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.rentalHistoryService.getAdminHistory({
      page,
      limit,
      search,
      from,
      to,
      status,
      sort: sort === 'asc' ? 'asc' : 'desc',
    });
  }
}
