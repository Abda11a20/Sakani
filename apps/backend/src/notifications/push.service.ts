// apps/backend/src/notifications/push.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private isConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:admin@sakani.com';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys are missing from configuration. Web Push Notifications are disabled.',
      );
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isConfigured = true;
      this.logger.log('✅ Web Push VAPID details configured successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to configure Web Push VAPID details:',
        error.message,
      );
    }
  }

  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  async subscribe(
    userId: string,
    subscriptionDto: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    deviceName?: string,
    browser?: string,
  ) {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: subscriptionDto.endpoint },
    });

    if (existing) {
      return this.prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          userId,
          lastUsedAt: new Date(),
          revokedAt: null,
          deviceName: deviceName ?? existing.deviceName,
          browser: browser ?? existing.browser,
        },
      });
    }

    return this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscriptionDto.endpoint,
        p256dh: subscriptionDto.keys.p256dh,
        auth: subscriptionDto.keys.auth,
        deviceName: deviceName || 'Unknown Device',
        browser: browser || 'Unknown Browser',
      },
    });
  }

  async unsubscribe(endpoint: string) {
    try {
      await this.prisma.pushSubscription.delete({
        where: { endpoint },
      });
      return { success: true };
    } catch {
      // Return success even if it didn't exist or failed to delete
      return { success: true };
    }
  }

  async getSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async deleteSubscriptionById(userId: string, subscriptionId: string) {
    const sub = await this.prisma.pushSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (sub) {
      await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
    }
    return { success: true };
  }

  async sendPush(
    userId: string,
    title: string,
    body: string,
    url?: string | null,
  ) {
    if (!this.isConfigured) {
      this.logger.warn(
        `Skipping push sending to user ${userId} because VAPID is not configured.`,
      );
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId, revokedAt: null },
    });

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || null,
      version: 1, // Notification versioning for backward compatibility
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        // Update lastUsedAt on success
        await this.prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send push notification to subscription ${sub.id}: ${error.message}`,
        );

        // Remove expired/invalid subscriptions (410 Gone / 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.logger.log(
            `Removing expired or invalid push subscription ${sub.id} (status: ${error.statusCode})`,
          );
          await this.prisma.pushSubscription
            .delete({
              where: { id: sub.id },
            })
            .catch((err) =>
              this.logger.error(
                `Failed to delete subscription: ${err.message}`,
              ),
            );
        }
      }
    });

    await Promise.all(sendPromises);
  }

  async sendBulkPush(
    userIds: string[],
    title: string,
    body: string,
    url?: string | null,
  ) {
    const promises = userIds.map((userId) =>
      this.sendPush(userId, title, body, url),
    );
    await Promise.all(promises);
  }
}
