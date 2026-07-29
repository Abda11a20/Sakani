// apps/backend/src/admin/admin-account-lifecycle.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin Account Lifecycle')
@ApiBearerAuth()
@Controller('admin/account-lifecycle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminAccountLifecycleController {
  constructor(private readonly usersService: UsersService) {}

  // ── 1. List Account Lifecycle Requests (In Grace Period / Restored / Cancelled) ──
  @Get()
  async getLifecycleUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.getAccountLifecycleUsers(
      page,
      limit,
      status,
      search,
    );
  }

  // ── 2. Restore User Account ───────────────────────────────────────────────
  @Post(':id/restore')
  async restoreUser(
    @Param('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.usersService.restoreAccount(userId, reason);
  }

  // ── 3. Purge / Soft Anonymize User ──────────────────────────────────────
  @Post(':id/purge')
  async purgeUser(@Param('id') userId: string) {
    return this.usersService.anonymizeUser(userId);
  }
}
