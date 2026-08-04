import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateAdDto } from './dto/create-ad.dto';
import { GetActiveAdQueryDto } from './dto/ad-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, AdStatus } from '@prisma/client';

@ApiTags('Admin / Advertisements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.super_admin, UserRole.admin)
@Controller('admin/ads')
export class AdsAdminController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * GET /api/v1/admin/ads/analytics
   * Overview dashboard analytics & metrics
   */
  @Get('analytics')
  async getDashboardAnalytics() {
    return this.adsService.getDashboardAnalytics();
  }

  /**
   * POST /api/v1/admin/ads/campaigns
   * Create new commercial campaign
   */
  @Post('campaigns')
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.adsService.createCampaign(dto, userId);
  }

  /**
   * GET /api/v1/admin/ads/campaigns
   * List all campaigns
   */
  @Get('campaigns')
  async getAllCampaigns() {
    return this.adsService.getAllCampaigns();
  }

  /**
   * PATCH /api/v1/admin/ads/campaigns/:id
   * Update campaign details (including isPaid status)
   */
  @Patch('campaigns/:id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.adsService.updateCampaign(id, dto);
  }

  /**
   * DELETE /api/v1/admin/ads/campaigns/:id
   * Soft delete campaign
   */
  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string) {
    return this.adsService.deleteCampaign(id);
  }

  /**
   * PATCH /api/v1/admin/ads/:id
   * Update Advertisement details
   */
  @Patch(':id')
  async updateAd(
    @Param('id') adId: string,
    @Body() dto: any,
  ) {
    return this.adsService.updateAd(adId, dto);
  }

  /**
   * POST /api/v1/admin/ads
   * Create new Advertisement under campaign
   */
  @Post()
  async createAd(@Body() dto: CreateAdDto) {
    return this.adsService.createAd(dto);
  }

  /**
   * PATCH /api/v1/admin/ads/:id/status
   * Toggle ad status (PUBLISHED, PAUSED, DRAFT, etc.)
   */
  @Patch(':id/status')
  async updateAdStatus(
    @Param('id') adId: string,
    @Body('status') status: AdStatus,
  ) {
    return this.adsService.updateAdStatus(adId, status);
  }

  /**
   * DELETE /api/v1/admin/ads/:id
   * Soft delete advertisement
   */
  @Delete(':id')
  async deleteAd(@Param('id') adId: string) {
    return this.adsService.deleteAd(adId);
  }

  /**
   * PATCH /api/v1/admin/ads/settings/:key
   * Toggle global system setting (e.g. adsEnabled)
   */
  @Patch('settings/:key')
  async toggleSystemSetting(
    @Param('key') key: string,
    @Body('value') value: boolean,
  ) {
    return this.adsService.toggleSystemSetting(key, value);
  }

  /**
   * PATCH /api/v1/admin/ads/placements/:key
   * Enable/Disable Placement Config
   */
  @Patch('placements/:key')
  async togglePlacement(
    @Param('key') key: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.adsService.togglePlacement(key, enabled);
  }

  // ────────────────────────────────────────────────────────
  // APPROVAL WORKFLOW & VERSIONING ENDPOINTS
  // ────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/ads/:id/submit-review
   */
  @Post(':id/submit-review')
  async submitForReview(@Param('id') adId: string) {
    return this.adsService.submitForReview(adId);
  }

  /**
   * POST /api/v1/admin/ads/:id/approve
   */
  @Post(':id/approve')
  async approveAd(@Param('id') adId: string) {
    return this.adsService.approveAd(adId);
  }

  /**
   * POST /api/v1/admin/ads/:id/publish
   */
  @Post(':id/publish')
  async publishAd(@Param('id') adId: string) {
    return this.adsService.publishAd(adId);
  }

  /**
   * GET /api/v1/admin/ads/:id/versions
   */
  @Get(':id/versions')
  async getAdVersions(@Param('id') adId: string) {
    return this.adsService.getAdVersions(adId);
  }

  /**
   * GET /api/v1/admin/ads/debug
   * Debug Ad Matching Engine (Diagnostics Inspector)
   */
  @Get('debug')
  async debugAdMatching(@Query() query: GetActiveAdQueryDto) {
    return this.adsService.debugAdMatching(query);
  }

  /**
   * POST /api/v1/admin/ads/:id/versions/:versionNumber/rollback
   */
  @Post(':id/versions/:versionNumber/rollback')
  async rollbackAdVersion(
    @Param('id') adId: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.adsService.rollbackAdVersion(adId, parseInt(versionNumber, 10));
  }
}
