import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AdCacheService } from './interfaces/ad-cache.interface';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateAdDto } from './dto/create-ad.dto';
import { GetActiveAdQueryDto } from './dto/ad-query.dto';
import { AdImpressionEvent, AdClickEvent } from './events/ad.events';
import { AdStatus, DeviceTarget, TargetUserRole } from '@prisma/client';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AdCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ────────────────────────────────────────────────────────
  // PUBLIC ENDPOINTS LOGIC
  // ────────────────────────────────────────────────────────

  /**
   * Get active matching ad for a placement with weighted random selection (A/B testing)
   */
  async getActiveAdForSlot(query: GetActiveAdQueryDto) {
    // 1. Check global system setting
    const adsEnabledSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'adsEnabled' },
    });
    if (adsEnabledSetting && !adsEnabledSetting.value) {
      return null; // System disabled -> zero footprint return null
    }

    // 2. Resolve placement
    const placement = await this.prisma.adPlacementConfig.findUnique({
      where: { key: query.placementKey },
    });
    if (!placement || !placement.enabled) {
      return null;
    }

    // 3. Try Cache first
    const cacheKey = `active_ad_${query.placementKey}_${query.userRole || 'ALL'}_${query.deviceTarget || 'ALL'}`;
    const cachedAd = await this.cache.get<any>(cacheKey);
    if (cachedAd) {
      return cachedAd;
    }

    const now = new Date();
    const currentMinutes =
      query.clientMinutes ?? now.getHours() * 60 + now.getMinutes();

    // 4. Fetch candidate ads matching criteria
    const whereCondition: any = {
      placementId: placement.id,
      status: AdStatus.PUBLISHED,
      deletedAt: null,
      campaign: {
        status: AdStatus.PUBLISHED,
        deletedAt: null,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        targetUserRole: {
          in: [TargetUserRole.ALL, query.userRole || TargetUserRole.ALL],
        },
        targetDevice: {
          in: [DeviceTarget.ALL, query.deviceTarget || DeviceTarget.ALL],
        },
      },
    };

    if (query.category) {
      whereCondition.category = query.category;
    }

    const ads = await this.prisma.advertisement.findMany({
      where: whereCondition,
      include: {
        target: true,
        mediaItems: { orderBy: { order: 'asc' } },
        campaign: {
          select: {
            name: true,
            clientName: true,
            clientLogo: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }],
    });

    if (!ads.length) {
      return null;
    }

    // 5. Filter by time window (dailyStartMinutes / dailyEndMinutes)
    const validAds = ads.filter((ad) => {
      // Check max limits
      if (ad.maxViews && ad.viewsCount >= ad.maxViews) return false;
      if (ad.maxClicks && ad.clicksCount >= ad.maxClicks) return false;

      // Check daily time bounds if specified
      if (ad.dailyStartMinutes !== null && ad.dailyEndMinutes !== null) {
        if (
          currentMinutes < ad.dailyStartMinutes ||
          currentMinutes > ad.dailyEndMinutes
        ) {
          return false;
        }
      }
      return true;
    });

    if (!validAds.length) {
      return null;
    }

    // 6. Smart Priority & Weighted Selection Algorithm
    // Score = (Priority * 0.4) + (CTR * 0.4) + (Freshness * 0.2)
    const validAdsWithScores = validAds.map((ad) => {
      const ctr = ad.viewsCount > 0 ? ad.clicksCount / ad.viewsCount : 0;
      const ctrScore = Math.min(ctr * 100, 100);
      const daysOld =
        (Date.now() - new Date(ad.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(100 - daysOld * 2, 10);
      const smartScore =
        ad.priority * 0.4 + ctrScore * 0.4 + freshnessScore * 0.2;
      const dynamicWeight = (ad.trafficWeight || 50) * (smartScore / 50);
      return { ad, dynamicWeight };
    });

    const totalWeight = validAdsWithScores.reduce(
      (sum, item) => sum + item.dynamicWeight,
      0,
    );
    let randomNum = Math.random() * totalWeight;
    let selectedAd = validAdsWithScores[0].ad;

    for (const item of validAdsWithScores) {
      randomNum -= item.dynamicWeight;
      if (randomNum <= 0) {
        selectedAd = item.ad;
        break;
      }
    }

    // Format output
    const result = {
      id: selectedAd.id,
      title: selectedAd.title,
      placementKey: query.placementKey,
      displayType: selectedAd.displayType,
      openMode: selectedAd.openMode,
      target: selectedAd.target,
      mediaItems: selectedAd.mediaItems,
      isSkippable: selectedAd.isSkippable,
      isClosable: selectedAd.isClosable,
      skipSeconds: selectedAd.skipSeconds,
      perUserFrequency: selectedAd.perUserFrequency,
      maxDisplayPerSession: selectedAd.maxDisplayPerSession,
      clientName: selectedAd.campaign.clientName,
      clientLogo: selectedAd.campaign.clientLogo,
      utmUrl: (selectedAd as any).finalUtmUrl,
    };

    // Cache for 15 seconds to prevent DB hit storm while allowing rotation
    await this.cache.set(cacheKey, result, 15);

    return result;
  }

  /**
   * Track ad impression event
   */
  async recordImpression(
    adId: string,
    reqDetails: {
      userId?: string;
      referrer?: string;
      deviceType?: DeviceTarget;
      ip?: string;
      userAgent?: string;
    },
  ) {
    this.eventEmitter.emit(
      'ad.impression',
      new AdImpressionEvent(
        adId,
        reqDetails.userId,
        reqDetails.referrer,
        reqDetails.deviceType,
        reqDetails.ip,
        reqDetails.userAgent,
      ),
    );
    return { success: true };
  }

  /**
   * Track ad click event
   */
  async recordClick(
    adId: string,
    reqDetails: {
      userId?: string;
      referrer?: string;
      deviceType?: DeviceTarget;
      ip?: string;
      userAgent?: string;
    },
  ) {
    this.eventEmitter.emit(
      'ad.click',
      new AdClickEvent(
        adId,
        reqDetails.userId,
        reqDetails.referrer,
        reqDetails.deviceType,
        reqDetails.ip,
        reqDetails.userAgent,
      ),
    );

    const ad = await this.prisma.advertisement.findUnique({
      where: { id: adId },
      include: { target: true },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    return {
      success: true,
      target: ad.target,
      utmUrl: (ad as any).finalUtmUrl,
    };
  }

  // ────────────────────────────────────────────────────────
  // SUPER ADMIN CRUD & DASHBOARD ANALYTICS LOGIC
  // ────────────────────────────────────────────────────────

  /**
   * Create Campaign
   */
  async createCampaign(
    dto: CreateCampaignDto,
    userId: string | { id: string; [key: string]: unknown },
  ) {
    const existing = await this.prisma.campaign.findUnique({
      where: { campaignCode: dto.campaignCode },
    });
    if (existing) {
      throw new BadRequestException(
        `Campaign code ${dto.campaignCode} already exists.`,
      );
    }

    const actualUserId: string =
      typeof userId === 'object' && userId?.id ? userId.id : (userId as string);

    return this.prisma.campaign.create({
      data: {
        campaignCode: dto.campaignCode,
        name: dto.name,
        clientName: dto.clientName,
        clientLogo: dto.clientLogo,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        price: dto.price,
        currency: dto.currency || 'EGP',
        isPaid: dto.isPaid ?? false,
        paymentMethod: dto.paymentMethod,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        timezone: dto.timezone || 'Africa/Cairo',
        notes: dto.notes,
        status: dto.status || AdStatus.PUBLISHED,
        targetUserRole: dto.targetUserRole || TargetUserRole.ALL,
        targetDevice: dto.targetDevice || DeviceTarget.ALL,
        targetCountry: dto.targetCountry || 'ALL',
        createdById: actualUserId,
      },
    });
  }

  /**
   * Get all campaigns with metrics
   */
  async getAllCampaigns() {
    return this.prisma.campaign.findMany({
      where: { deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        ads: {
          where: { deletedAt: null },
          include: {
            target: true,
            mediaItems: { orderBy: { order: 'asc' } },
            placement: { select: { id: true, key: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update Campaign
   */
  async updateCampaign(campaignId: string, dto: any) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.clientName !== undefined) dataToUpdate.clientName = dto.clientName;
    if (dto.clientPhone !== undefined)
      dataToUpdate.clientPhone = dto.clientPhone;
    if (dto.clientEmail !== undefined)
      dataToUpdate.clientEmail = dto.clientEmail;
    if (dto.price !== undefined) dataToUpdate.price = dto.price;
    if (dto.currency !== undefined) dataToUpdate.currency = dto.currency;
    if (dto.isPaid !== undefined) dataToUpdate.isPaid = dto.isPaid;
    if (dto.paymentMethod !== undefined) {
      const validPaymentMethods = [
        'CASH',
        'BANK_TRANSFER',
        'INSTAPAY',
        'VODAFONE_CASH',
        'CREDIT_CARD',
        'OTHER',
      ];
      dataToUpdate.paymentMethod = validPaymentMethods.includes(
        dto.paymentMethod,
      )
        ? dto.paymentMethod
        : 'OTHER';
    }
    if (dto.startDate !== undefined)
      dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined)
      dataToUpdate.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.notes !== undefined) dataToUpdate.notes = dto.notes;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.budget !== undefined) dataToUpdate.budget = dto.budget;

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: dataToUpdate,
    });
    await this.cache.reset();
    return updated;
  }

  /**
   * Soft Delete Campaign
   */
  async deleteCampaign(campaignId: string) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Campaign not found');
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { deletedAt: new Date() },
    });
    await this.cache.reset();
    return { message: 'Campaign soft-deleted successfully' };
  }

  /**
   * Create Advertisement under a Campaign
   */
  async createAd(dto: CreateAdDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    let placement = await this.prisma.adPlacementConfig.findUnique({
      where: { key: dto.placementKey },
    });
    if (!placement) {
      placement = await this.prisma.adPlacementConfig.create({
        data: {
          key: dto.placementKey,
          name:
            dto.placementKey === 'POPUP'
              ? 'إعلان منبثق (Popup)'
              : dto.placementKey,
          enabled: true,
        },
      });
    }

    // Build UTM Url
    const rawWa = dto.target?.whatsapp
      ? `https://wa.me/${dto.target.whatsapp.replace(/\D/g, '')}`
      : null;
    const baseUrl = dto.target?.url || rawWa || '';
    const finalUtmUrl = baseUrl
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}utm_source=sakany&utm_medium=${dto.displayType || 'BANNER'}&utm_campaign=${encodeURIComponent(campaign.name)}`
      : null;

    const ad = await this.prisma.advertisement.create({
      data: {
        campaignId: dto.campaignId,
        title: dto.title,
        placementId: placement.id,
        openMode: dto.openMode || 'NEW_TAB',
        displayType: dto.displayType || 'BANNER',
        category: dto.category || 'REAL_ESTATE',
        daysOfWeek: dto.daysOfWeek || [],
        dailyStartMinutes: dto.dailyStartMinutes,
        dailyEndMinutes: dto.dailyEndMinutes,
        maxViews: dto.maxViews,
        maxClicks: dto.maxClicks,
        perUserFrequency:
          dto.perUserFrequency &&
          [
            'EVERY_VISIT',
            'EVERY_12_HOURS',
            'DAILY',
            'WEEKLY',
            'MONTHLY',
            'ONLY_ONCE',
          ].includes(dto.perUserFrequency)
            ? (dto.perUserFrequency as any)
            : 'EVERY_12_HOURS',
        maxDisplayPerSession: dto.maxDisplayPerSession ?? 1,
        isSkippable: dto.isSkippable ?? true,
        isClosable: dto.isClosable ?? true,
        skipSeconds: dto.skipSeconds ?? 5,
        priority: dto.priority ?? 50,
        displayOrder: dto.displayOrder ?? 0,
        trafficWeight: dto.trafficWeight ?? 50,
        status: dto.status || AdStatus.DRAFT,
        finalUtmUrl,
        target: {
          create: {
            type: dto.target.type,
            url: dto.target.url,
            phone: dto.target.phone,
            email: dto.target.email,
            whatsapp: dto.target.whatsapp,
            internalRoute: dto.target.internalRoute,
            appDeepLink: dto.target.appDeepLink,
          },
        },
        mediaItems: {
          createMany: {
            data: dto.mediaItems.map((item, idx) => ({
              url: item.url,
              thumbnailUrl: item.thumbnailUrl,
              type: item.type || 'IMAGE',
              caption: item.caption,
              durationSeconds: item.durationSeconds,
              order: item.order ?? idx,
            })),
          },
        },
      } as any,
      include: {
        target: true,
        mediaItems: true,
        campaign: { select: { name: true, clientName: true } },
        placement: { select: { name: true, key: true } },
      },
    });

    // Create Initial Version v1
    await (this.prisma as any).adVersion.create({
      data: {
        adId: ad.id,
        versionNumber: 1,
        title: ad.title,
        targetData: ad.target || {},
        mediaData: ad.mediaItems || [],
      },
    });

    await this.cache.reset();
    return ad;
  }

  /**
   * Update Advertisement (including controls, target, and mediaItems)
   */
  async updateAd(adId: string, dto: any) {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id: adId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Advertisement not found');
    }

    const dataToUpdate: any = {};
    if (dto.title !== undefined) dataToUpdate.title = dto.title;
    if (dto.category !== undefined) dataToUpdate.category = dto.category;
    if (dto.displayType !== undefined)
      dataToUpdate.displayType = dto.displayType;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.isSkippable !== undefined)
      dataToUpdate.isSkippable = dto.isSkippable;
    if (dto.isClosable !== undefined) dataToUpdate.isClosable = dto.isClosable;
    if (dto.skipSeconds !== undefined)
      dataToUpdate.skipSeconds = dto.skipSeconds;
    if (dto.perUserFrequency !== undefined) {
      const validCaps = [
        'EVERY_VISIT',
        'EVERY_3_HOURS',
        'EVERY_6_HOURS',
        'EVERY_12_HOURS',
        'EVERY_15_HOURS',
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'ONLY_ONCE',
      ];
      dataToUpdate.perUserFrequency = validCaps.includes(dto.perUserFrequency)
        ? dto.perUserFrequency
        : 'EVERY_VISIT';
    }
    if (dto.maxDisplayPerSession !== undefined)
      dataToUpdate.maxDisplayPerSession = dto.maxDisplayPerSession;

    if (dto.placementKey) {
      let placement = await this.prisma.adPlacementConfig.findUnique({
        where: { key: dto.placementKey },
      });
      if (!placement) {
        placement = await this.prisma.adPlacementConfig.create({
          data: {
            key: dto.placementKey,
            name:
              dto.placementKey === 'POPUP'
                ? 'إعلان منبثق (Popup)'
                : dto.placementKey,
            enabled: true,
          },
        });
      }
      dataToUpdate.placementId = placement.id;
    }

    // Update target if provided
    if (dto.target) {
      await this.prisma.adTarget.updateMany({
        where: { advertisementId: adId },
        data: {
          type: dto.target.type,
          url: dto.target.url,
          phone: dto.target.phone,
          email: dto.target.email,
          whatsapp: dto.target.whatsapp,
          internalRoute: dto.target.internalRoute,
          appDeepLink: dto.target.appDeepLink,
        },
      });
    }

    // Update media items if provided
    if (dto.mediaItems && dto.mediaItems.length > 0) {
      await this.prisma.adMedia.deleteMany({
        where: { adId },
      });
      await this.prisma.adMedia.createMany({
        data: dto.mediaItems.map((item: any, idx: number) => ({
          adId,
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          type: item.type || 'IMAGE',
          caption: item.caption,
          durationSeconds: item.durationSeconds,
          order: item.order ?? idx,
        })),
      });
    }

    const updated = await this.prisma.advertisement.update({
      where: { id: adId },
      data: dataToUpdate,
      include: {
        target: true,
        mediaItems: true,
        campaign: true,
      },
    });

    await this.cache.reset();
    return updated;
  }

  /**
   * Update Ad Status
   */
  async updateAdStatus(adId: string, status: AdStatus) {
    const ad = await this.prisma.advertisement.update({
      where: { id: adId },
      data: {
        status,
        publishedAt: status === AdStatus.PUBLISHED ? new Date() : undefined,
        archivedAt: status === AdStatus.ARCHIVED ? new Date() : undefined,
      },
    });
    await this.cache.reset();
    return ad;
  }

  /**
   * Soft Delete Ad
   */
  async deleteAd(adId: string) {
    await this.prisma.advertisement.update({
      where: { id: adId },
      data: { deletedAt: new Date() },
    });
    await this.cache.reset();
    return { message: 'Ad deleted successfully' };
  }

  /**
   * Super Admin Overview Dashboard Analytics
   */
  async getDashboardAnalytics() {
    const totalCampaigns = await this.prisma.campaign.count({
      where: { deletedAt: null },
    });
    const totalAds = await this.prisma.advertisement.count({
      where: { deletedAt: null },
    });
    const activeAds = await this.prisma.advertisement.count({
      where: { status: AdStatus.PUBLISHED, deletedAt: null },
    });

    // Aggregate Views & Clicks
    const aggregates = await this.prisma.advertisement.aggregate({
      where: { deletedAt: null },
      _sum: { viewsCount: true, clicksCount: true },
    });

    const totalViews = aggregates._sum.viewsCount || 0;
    const totalClicks = aggregates._sum.clicksCount || 0;
    const overallCtr =
      totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    // Fetch Ads with Performance Metrics
    const ads = await this.prisma.advertisement.findMany({
      where: { deletedAt: null },
      include: {
        campaign: { select: { name: true, clientName: true } },
        placement: { select: { name: true, key: true } },
      },
    });

    const adsWithMetrics = ads.map((ad) => {
      const ctr =
        ad.viewsCount > 0 ? (ad.clicksCount / ad.viewsCount) * 100 : 0;
      const isPoorPerformance = ad.viewsCount >= 300 && ctr < 0.3;
      return {
        ...ad,
        ctr: ctr.toFixed(2),
        isPoorPerformance,
      };
    });

    // Top Performing & Low Performing Ads
    const topPerforming = [...adsWithMetrics]
      .sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr))
      .slice(0, 5);

    const poorPerforming = adsWithMetrics.filter((ad) => ad.isPoorPerformance);

    // System Settings & Placements
    const systemSettings = await this.prisma.systemSetting.findMany();
    const placementConfigs = await this.prisma.adPlacementConfig.findMany();

    return {
      overview: {
        totalCampaigns,
        totalAds,
        activeAds,
        totalViews,
        totalClicks,
        overallCtr: `${overallCtr}%`,
      },
      topPerforming,
      poorPerforming,
      placementConfigs,
      systemSettings,
    };
  }

  /**
   * Toggle SystemSetting (e.g. adsEnabled)
   */
  async toggleSystemSetting(key: string, value: boolean) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: 'System feature toggle' },
    });
    await this.cache.reset();
    return setting;
  }

  /**
   * Toggle Placement Config
   */
  async togglePlacement(placementKey: string, enabled: boolean) {
    const placement = await this.prisma.adPlacementConfig.update({
      where: { key: placementKey },
      data: { enabled },
    });
    await this.cache.reset();
    return placement;
  }

  // ────────────────────────────────────────────────────────
  // APPROVAL WORKFLOW & AD VERSIONING
  // ────────────────────────────────────────────────────────

  /**
   * Submit Ad for Marketing Review (Draft -> Under Review)
   */
  async submitForReview(adId: string) {
    const ad = await this.prisma.advertisement.update({
      where: { id: adId },
      data: { status: 'UNDER_REVIEW' as any },
    });
    await this.cache.reset();
    return ad;
  }

  /**
   * Approve Ad (Under Review -> Approved)
   */
  async approveAd(adId: string) {
    const ad = await this.prisma.advertisement.update({
      where: { id: adId },
      data: { status: 'APPROVED' as any },
    });
    await this.cache.reset();
    return ad;
  }

  /**
   * Publish Ad (Approved/Draft -> Published)
   */
  async publishAd(adId: string) {
    const ad = await this.prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: AdStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    await this.cache.reset();
    return ad;
  }

  /**
   * Get version history for an ad
   */
  async getAdVersions(adId: string) {
    return (this.prisma as any).adVersion.findMany({
      where: { adId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Rollback Ad configuration to a previous version
   */
  async rollbackAdVersion(adId: string, versionNumber: number) {
    const targetVersion = await (this.prisma as any).adVersion.findUnique({
      where: { adId_versionNumber: { adId, versionNumber } },
    });

    if (!targetVersion) {
      throw new NotFoundException(
        `Version ${versionNumber} for ad ${adId} not found.`,
      );
    }

    const updatedAd = await this.prisma.advertisement.update({
      where: { id: adId },
      data: {
        title: targetVersion.title,
      },
      include: { target: true, mediaItems: true },
    });

    await this.cache.reset();
    return {
      message: `Successfully rolled back ad ${adId} to version ${versionNumber}`,
      ad: updatedAd,
    };
  }

  /**
   * Debug Ad Matching Engine (Diagnostics Inspector)
   */
  async debugAdMatching(query: GetActiveAdQueryDto) {
    const isGlobalEnabled = await this.prisma.systemSetting.findUnique({
      where: { key: 'adsEnabled' },
    });
    if (isGlobalEnabled && isGlobalEnabled.value === false) {
      return {
        status: 'DISABLED_GLOBALLY',
        reason: 'adsEnabled system setting is set to false',
        candidatesEvaluated: 0,
        selectedAd: null,
        evaluatedCandidates: [],
      };
    }

    const placement = await this.prisma.adPlacementConfig.findUnique({
      where: { key: query.placementKey },
    });
    if (!placement || !placement.enabled) {
      return {
        status: 'PLACEMENT_DISABLED',
        reason: `Placement ${query.placementKey} is disabled or missing`,
        candidatesEvaluated: 0,
        selectedAd: null,
        evaluatedCandidates: [],
      };
    }

    const now = new Date();
    const currentMinutes =
      query.clientMinutes ?? now.getHours() * 60 + now.getMinutes();

    const whereCondition: any = {
      placementId: placement.id,
      deletedAt: null,
      campaign: {
        deletedAt: null,
      },
    };
    if (query.category) {
      whereCondition.category = query.category;
    }

    const allAds = await this.prisma.advertisement.findMany({
      where: whereCondition,
      include: {
        target: true,
        mediaItems: { orderBy: { order: 'asc' } },
        campaign: true,
      },
    });

    const evaluatedCandidates = allAds.map((ad) => {
      const exclusionReasons: string[] = [];

      if (ad.status !== AdStatus.PUBLISHED) {
        exclusionReasons.push(`الإعلان غير نشط (الحالة الحالية: ${ad.status})`);
      }
      if (ad.campaign.status !== AdStatus.PUBLISHED) {
        exclusionReasons.push(
          `الحملة ليست نشطة (حالة الحملة الحالية: ${ad.campaign.status})`,
        );
      }
      if (!ad.campaign.isPaid) {
        exclusionReasons.push(`الحملة غير مدفوعة (isPaid: false)`);
      }
      if (ad.campaign.startDate > now) {
        exclusionReasons.push(
          `تاريخ بدء الحملة لم يبدأ بعد (${new Date(ad.campaign.startDate).toLocaleDateString('ar-EG')})`,
        );
      }
      if (ad.campaign.endDate && new Date(ad.campaign.endDate) < now) {
        exclusionReasons.push(
          `تاريخ انتهاء الحملة انتهى (${new Date(ad.campaign.endDate).toLocaleDateString('ar-EG')})`,
        );
      }
      if (
        ad.campaign.targetUserRole !== TargetUserRole.ALL &&
        ad.campaign.targetUserRole !== (query.userRole || TargetUserRole.ALL)
      ) {
        exclusionReasons.push(
          `نوع المستخدم المستهدف لا يطابق الشروط (مطلوب: ${ad.campaign.targetUserRole})`,
        );
      }
      if (
        ad.campaign.targetDevice !== DeviceTarget.ALL &&
        ad.campaign.targetDevice !== (query.deviceTarget || DeviceTarget.ALL)
      ) {
        exclusionReasons.push(
          `نوع الجهاز المستهدف لا يطابق الشروط (مطلوب: ${ad.campaign.targetDevice})`,
        );
      }
      if (ad.maxViews && ad.viewsCount >= ad.maxViews) {
        exclusionReasons.push(
          `تم الوصول للحد الأقصى للمشاهدات (${ad.viewsCount}/${ad.maxViews})`,
        );
      }
      if (ad.maxClicks && ad.clicksCount >= ad.maxClicks) {
        exclusionReasons.push(
          `تم الوصول للحد الأقصى للنقرات (${ad.clicksCount}/${ad.maxClicks})`,
        );
      }
      if (ad.dailyStartMinutes !== null && ad.dailyEndMinutes !== null) {
        if (
          currentMinutes < ad.dailyStartMinutes ||
          currentMinutes > ad.dailyEndMinutes
        ) {
          exclusionReasons.push(`خارج ساعات العرض اليومية المحددة للإعلان`);
        }
      }

      const isEligible = exclusionReasons.length === 0;

      const ctr = ad.viewsCount > 0 ? ad.clicksCount / ad.viewsCount : 0;
      const ctrScore = Math.min(ctr * 100, 100);
      const daysOld =
        (Date.now() - new Date(ad.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(100 - daysOld * 2, 10);
      const smartScore =
        ad.priority * 0.4 + ctrScore * 0.4 + freshnessScore * 0.2;
      const dynamicWeight = (ad.trafficWeight || 50) * (smartScore / 50);

      return {
        id: ad.id,
        title: ad.title,
        campaignCode: ad.campaign.campaignCode,
        clientName: ad.campaign.clientName,
        status: ad.status,
        campaignStatus: ad.campaign.status,
        isPaid: ad.campaign.isPaid,
        isEligible,
        exclusionReasons,
        metrics: {
          views: ad.viewsCount,
          clicks: ad.clicksCount,
          ctrPercent: `${(ctr * 100).toFixed(2)}%`,
          priority: ad.priority,
          freshnessDays: daysOld.toFixed(1),
          smartScore: smartScore.toFixed(2),
          dynamicWeight: dynamicWeight.toFixed(2),
        },
      };
    });

    const eligibleAds = evaluatedCandidates.filter((c) => c.isEligible);
    const selectedAd = eligibleAds.length > 0 ? eligibleAds[0] : null;

    return {
      status: selectedAd ? 'SUCCESS_MATCHED' : 'NO_ELIGIBLE_ADS',
      placementKey: query.placementKey,
      clientMinutes: currentMinutes,
      totalAdsFound: allAds.length,
      eligibleAdsCount: eligibleAds.length,
      selectedAd,
      evaluatedCandidates,
    };
  }
}
