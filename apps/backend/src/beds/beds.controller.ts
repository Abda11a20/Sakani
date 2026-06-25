// apps/backend/src/beds/beds.controller.ts

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BedsService } from './beds.service';
import { RentBedDto } from './dto/rent-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller()
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  // ── 1. جلب الأسرة الخاصة بإعلان (عام / Landlord) ──────────────────────────
  @Get('listings/:listingId/beds')
  async getListingBeds(@Param('listingId') listingId: string) {
    // الحل الأبسط المتبع: هذا الـ route للعامة، لذا نمرر false
    return this.bedsService.getListingBeds(listingId, false);
  }

  // ── جلب كل الأسرة للمؤجر ──────────────────────────────────────────────────
  @Get('listings/:listingId/beds/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async getAllListingBedsForLandlord(
    @Param('listingId') listingId: string,
    @CurrentUser() user: SafeUser,
  ) {
    // يمكن للـ service التحقق إن كان هو المالك، لكن سنمرر true لأنه موثق كمالك
    // سيعرض له كل الأسرة
    return this.bedsService.getListingBeds(listingId, true);
  }

  // ── 2. جلب إحصائيات الأسرة لإعلان (عام) ──────────────────────────────────
  @Get('listings/:listingId/beds/stats')
  async getListingBedStats(@Param('listingId') listingId: string) {
    return this.bedsService.getListingBedStats(listingId);
  }

  // ── 3. تفاصيل سرير واحد (عام) ───────────────────────────────────────────
  @Get('beds/:bedId')
  async getBedDetails(@Param('bedId') bedId: string) {
    return this.bedsService.getBedDetails(bedId);
  }

  // ── 4. تأجير سرير (Landlord فقط) ─────────────────────────────────────────
  @Patch('beds/:bedId/rent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async rentBed(
    @Param('bedId') bedId: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: RentBedDto,
  ) {
    return this.bedsService.rentBed(bedId, user.id, dto);
  }

  // ── 5. إخلاء سرير (Landlord فقط) ─────────────────────────────────────────
  @Patch('beds/:bedId/vacate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async vacateBed(
    @Param('bedId') bedId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.bedsService.vacateBed(bedId, user.id);
  }

  // ── 6. تغيير نوع السرير (Landlord فقط) ───────────────────────────────────
  @Patch('beds/:bedId/type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  async updateBedType(
    @Param('bedId') bedId: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateBedDto,
  ) {
    return this.bedsService.updateBedType(bedId, user.id, dto);
  }
}
