// apps/backend/src/listings/listings.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── 1. إنشاء إعلان جديد (للمؤجر فقط) ──────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async create(
    @CurrentUser() user: SafeUser,
    @Body() createListingDto: CreateListingDto,
  ) {
    return this.listingsService.create(user.id, createListingDto);
  }

  // ── 2. جلب إعلانات المؤجر (للمؤجر فقط) ────────────────────────────────────
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async getMyListings(@CurrentUser() user: SafeUser) {
    return this.listingsService.getMyListings(user.id);
  }

  // ── 3. بحث وجلب الإعلانات (للعامة) ────────────────────────────────────────
  @Get()
  async findAll(@Query() query: ListingQueryDto) {
    return this.listingsService.findAll(query);
  }

  // ── 4. عرض تفاصيل إعلان وزيادة عدد المشاهدات (للعامة) ────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // زيادة المشاهدات أولاً في الخلفية (أو ننتظره حسب الحاجة)
    await this.listingsService.incrementViewCount(id);
    return this.listingsService.findOne(id);
  }

  // ── 5. تعديل الإعلان (للمؤجر صاحبه فقط) ──────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, updateListingDto);
  }

  // ── 6. حذف الإعلان (Soft Delete) للمؤجر صاحبه فقط ────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async remove(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.listingsService.remove(id, user.id);
  }
}
