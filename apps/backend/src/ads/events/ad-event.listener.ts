import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AdImpressionEvent, AdClickEvent } from './ad.events';
import { AdStatus } from '@prisma/client';

@Injectable()
export class AdEventListener {
  private readonly logger = new Logger(AdEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('ad.impression', { async: true })
  async handleImpressionEvent(event: AdImpressionEvent) {
    try {
      // 1. Create log
      await this.prisma.adLog.create({
        data: {
          adId: event.adId,
          type: 'IMPRESSION',
          userId: event.userId,
          referrer: event.referrer,
          deviceType: event.deviceType,
          userIp: event.userIp,
          userAgent: event.userAgent,
        },
      });

      // 2. Increment view count
      const updatedAd = await this.prisma.advertisement.update({
        where: { id: event.adId },
        data: {
          viewsCount: { increment: 1 },
        },
        select: { id: true, viewsCount: true, maxViews: true, status: true },
      });

      // 3. Update AdDailyStats for today
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      await (this.prisma as any).adDailyStats.upsert({
        where: { adId_date: { adId: event.adId, date: today } },
        update: { views: { increment: 1 } },
        create: { adId: event.adId, date: today, views: 1 },
      });

      // 4. Auto-pause if maxViews reached
      if (
        updatedAd.maxViews &&
        updatedAd.viewsCount >= updatedAd.maxViews &&
        updatedAd.status === AdStatus.PUBLISHED
      ) {
        await this.prisma.advertisement.update({
          where: { id: event.adId },
          data: { status: AdStatus.LIMIT_REACHED },
        });
        this.logger.log(
          `Ad ${event.adId} reached maxViews (${updatedAd.maxViews}). Status set to LIMIT_REACHED.`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling ad impression event: ${error.message}`);
    }
  }

  @OnEvent('ad.click', { async: true })
  async handleClickEvent(event: AdClickEvent) {
    try {
      // 1. Create log
      await this.prisma.adLog.create({
        data: {
          adId: event.adId,
          type: 'CLICK',
          userId: event.userId,
          referrer: event.referrer,
          deviceType: event.deviceType,
          userIp: event.userIp,
          userAgent: event.userAgent,
        },
      });

      // 2. Increment click count
      const updatedAd = await this.prisma.advertisement.update({
        where: { id: event.adId },
        data: {
          clicksCount: { increment: 1 },
        },
        select: { id: true, clicksCount: true, maxClicks: true, status: true },
      });

      // 3. Update AdDailyStats for today
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      await (this.prisma as any).adDailyStats.upsert({
        where: { adId_date: { adId: event.adId, date: today } },
        update: { clicks: { increment: 1 } },
        create: { adId: event.adId, date: today, clicks: 1 },
      });

      // 4. Auto-pause if maxClicks reached
      if (
        updatedAd.maxClicks &&
        updatedAd.clicksCount >= updatedAd.maxClicks &&
        updatedAd.status === AdStatus.PUBLISHED
      ) {
        await this.prisma.advertisement.update({
          where: { id: event.adId },
          data: { status: AdStatus.LIMIT_REACHED },
        });
        this.logger.log(
          `Ad ${event.adId} reached maxClicks (${updatedAd.maxClicks}). Status set to LIMIT_REACHED.`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling ad click event: ${error.message}`);
    }
  }
}
