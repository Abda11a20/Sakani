// apps/backend/src/notifications/notification-dispatcher.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push.service';

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  /**
   * Dispatches a notification to all active communication channels.
   *
   * @param notification - The created notification object.
   */
  async dispatch(notification: Notification) {
    try {
      // 1. Database channel is already updated when notification is passed here.

      // 2. Identify if the notification type is important for Push Notification
      if (this.isImportantNotification(notification)) {
        // Fetch recipient role to build correct localized client route
        const recipient = await this.prisma.user.findUnique({
          where: { id: notification.userId },
          select: { role: true },
        });

        const route = this.resolveRoute(
          notification.type,
          notification.entityType,
          notification.entityId,
          recipient?.role,
        );

        this.logger.log(
          `Dispatching Web Push to user: ${notification.userId} for notification: ${notification.id}`,
        );

        await this.pushService.sendPush(
          notification.userId,
          notification.title,
          notification.body,
          route,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to dispatch notification ${notification.id}:`,
        error.message,
      );
    }
  }

  private isImportantNotification(notification: Notification): boolean {
    const { type, entityType } = notification;

    // Chat messages, viewing requests, admin alerts, system reviews
    if (
      type === NotificationType.CHAT ||
      type === NotificationType.REQUEST ||
      type === NotificationType.ALERT ||
      type === NotificationType.REVIEW
    ) {
      return true;
    }

    // Specific listing updates (approved / rejected)
    if (
      entityType === 'listing.approved' ||
      entityType === 'listing.rejected'
    ) {
      return true;
    }

    return false;
  }

  private resolveRoute(
    type: NotificationType,
    entityType: string | null,
    entityId: string | null,
    role?: string,
  ): string {
    const isLandlord = role === 'landlord';

    // 1. Support & Chat messages
    if (
      type === NotificationType.CHAT ||
      entityType === 'chat' ||
      entityType === 'CHAT'
    ) {
      return '/dashboard/support';
    }

    // 2. Viewing requests
    if (entityType && entityType.startsWith('viewing_request')) {
      return isLandlord
        ? '/dashboard/landlord/requests'
        : '/dashboard/tenant/viewing-requests';
    }

    // 3. Listings & Advertisements
    if (
      entityType === 'listing' ||
      entityType === 'listing.approved' ||
      entityType === 'listing.rejected'
    ) {
      return entityId
        ? isLandlord
          ? `/dashboard/landlord/advertisements/${entityId}`
          : `/listings/${entityId}`
        : '/';
    }

    return '/';
  }
}
