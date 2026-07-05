// apps/backend/src/users/users.controller.ts

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── 1. Get Current User Profile ─────────────────────────────────────────────
  @Get('users/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: SafeUser) {
    return this.usersService.getProfile(user.id);
  }

  // ── 2. Update Current User Profile ───────────────────────────────────────
  @Patch('users/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // ── 3. Delete Current User Profile ───────────────────────────────────────
  @Delete('users/profile')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@CurrentUser() user: SafeUser) {
    return this.usersService.deleteAccount(user.id);
  }

  // ── 4. Get Public Profile of Any User ────────────────────────────────
  @Get('users/:id')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  // ── 5. Lookup Tenant by Phone (Landlord/Admin only) ───────────────────
  @Get('users/lookup-by-phone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord, UserRole.admin, UserRole.super_admin)
  async lookupByPhone(@Query('phone') phone: string) {
    return this.usersService.lookupByPhone(phone);
  }

  // ── 6. Admin: List All Users (Commented out to avoid collision with admin/users route in admin.controller.ts) ─────────
  // @Get('admin/users')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.super_admin)
  // async getAllUsers(
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ) {
  //   return this.usersService.getAllUsers(page, limit);
  // }

  // ── 6. Admin: Toggle User Active Status (Commented out to avoid collision with toggle-status route in admin.controller.ts) ──
  // @Patch('admin/users/:id/status')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.super_admin)
  // async toggleUserStatus(@Param('id') id: string) {
  //   return this.usersService.toggleUserStatus(id);
  // }
}
