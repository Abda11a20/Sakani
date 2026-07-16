// apps/backend/src/community/admin-community.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CommunityPostStatus, ReportStatus } from '@prisma/client';

@Controller('admin/community')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminCommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('stats')
  async getStats() {
    return this.service.adminGetStats();
  }

  @Get('posts')
  async getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.adminGetPosts(page, limit);
  }

  @Get('reports')
  async getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.service.adminGetReports(page, limit);
  }

  @Patch('posts/:id/status')
  async updatePostStatus(
    @Param('id') id: string,
    @Body('status') status: CommunityPostStatus,
  ) {
    return this.service.adminUpdatePostStatus(id, status);
  }

  @Patch('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body('status') status: ReportStatus,
  ) {
    return this.service.adminResolveReport(id, status);
  }
}
