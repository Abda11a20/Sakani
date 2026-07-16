// apps/backend/src/community/community.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { RateHostDto } from './dto/rate-host.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { GenderPreference, User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('categories')
  async getCategories() {
    return this.service.getCategories();
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @Query('categoryId') categoryId?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('genderPreference') genderPreference?: GenderPreference,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.service.getPosts({
      categoryId,
      governorateId,
      cityId,
      genderPreference,
      search,
      date,
      page,
      limit,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(@CurrentUser() user: SafeUser, @Body() dto: CreatePostDto) {
    return this.service.createPost(user.id, dto);
  }

  @Get('alerts/me')
  @UseGuards(JwtAuthGuard)
  async getMyAlerts(@CurrentUser() user: SafeUser) {
    return this.service.getMyAlerts(user.id);
  }

  @Post('alerts')
  @UseGuards(JwtAuthGuard)
  async createAlert(@CurrentUser() user: SafeUser, @Body() dto: CreateAlertDto) {
    return this.service.createAlert(user.id, dto);
  }

  @Patch('alerts/:id')
  @UseGuards(JwtAuthGuard)
  async toggleAlert(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.service.toggleAlertStatus(id, user.id, isActive);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPostDetails(@Param('id') id: string) {
    return this.service.getPostDetails(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelPost(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.service.cancelPost(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.service.deletePost(id, user.id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async requestJoin(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.service.requestJoin(id, user.id);
  }

  @Patch('participants/:id')
  @UseGuards(JwtAuthGuard)
  async respondToJoinRequest(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.service.respondToJoinRequest(id, user.id, status);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async leaveActivity(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.service.leaveActivity(id, user.id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async reportPost(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.service.reportPost(user.id, id, dto.reason, dto.details);
  }

  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  async rateHost(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body() dto: RateHostDto,
  ) {
    return this.service.rateHost(id, user.id, dto.rating);
  }
}
