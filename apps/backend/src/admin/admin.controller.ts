// apps/backend/src/admin/admin.controller.ts

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ReviewListingDto } from './dto/review-listing.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole, ListingStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  // ── Listings ─────────────────────────────────────────────────────────────
  @Get('listings/pending')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getPendingListings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAllListings(page, limit, ListingStatus.pending_review);
  }

  @Get('listings')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getAllListings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: ListingStatus,
  ) {
    return this.adminService.getAllListings(page, limit, status);
  }

  @Patch('listings/:id/review')
  @Roles(UserRole.admin, UserRole.super_admin)
  async reviewListing(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: ReviewListingDto,
  ) {
    return this.adminService.reviewListing(id, user.id, dto);
  }

  @Delete('listings/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  async deleteListingPermanently(@Param('id') id: string) {
    return this.adminService.deleteListingPermanently(id);
  }

  // ── Users ────────────────────────────────────────────────────────────────
  @Get('users')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('isVerified') isVerified?: string,
  ) {
    return this.adminService.getAllUsers(page, limit, role, search, isActive, isVerified);
  }

  @Patch('users/:id/verify')
  @Roles(UserRole.admin, UserRole.super_admin)
  async verifyUser(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.adminService.verifyUser(id, user.id);
  }

  @Patch('users/:id/toggle-status')
  @Roles(UserRole.admin, UserRole.super_admin)
  async toggleUserStatus(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.adminService.toggleUserStatus(id, user.id);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.super_admin) // Only super_admin can change roles
  async updateUserRole(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, user.id, dto);
  }

  @Post('users')
  @Roles(UserRole.admin, UserRole.super_admin)
  async createUserByAdmin(@Body() dto: CreateUserDto) {
    return this.usersService.createUserByAdmin(dto);
  }

  @Delete('users/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  async deleteUserByAdmin(@Param('id') id: string) {
    return this.usersService.deleteUserByAdmin(id);
  }

  @Post('register-admin')
  @Roles(UserRole.super_admin)
  async registerAdmin(@Body() dto: CreateUserDto) {
    // Force the role to admin regardless of what is sent in the body
    return this.usersService.createUserByAdmin({ ...dto, role: UserRole.admin });
  }

  // ── Blacklist ────────────────────────────────────────────────────────────
  @Post('ban')
  @Roles(UserRole.admin, UserRole.super_admin)
  async banUser(
    @CurrentUser() user: SafeUser,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(user.id, dto);
  }

  @Get('banned')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getBannedUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getBannedUsers(page, limit);
  }

  @Delete('banned/:id')
  @Roles(UserRole.super_admin) // Only super_admin can lift bans
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    if (user.role !== UserRole.super_admin) {
      throw new ForbiddenException('Only super_admin can lift bans');
    }
    return this.adminService.unbanUser(id, user.id);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  @Get('dashboard/stats')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Requests ─────────────────────────────────────────────────────────────
  @Get('requests')
  @Roles(UserRole.admin, UserRole.super_admin)
  async getAllRequests(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllRequests(page, limit, status, search);
  }
}
