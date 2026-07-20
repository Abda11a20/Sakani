// apps/backend/src/auth/telegram-link-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramLinkCleanupService {
  private readonly logger = new Logger(TelegramLinkCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * تنظيف أكواد ربط تليجرام المنتهية الصلاحية كل ساعة
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredLinks(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.prisma.pendingTelegramLink.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `🧹 تم تنظيف ${result.count} من أكواد ربط تليجرام المنتهية الصلاحية.`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `❌ فشل تنظيف أكواد ربط تليجرام المنتهية الصلاحية: ${error.message}`,
      );
    }
  }
}
