import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationType,
  NotificationEventKey,
  NotificationPriority,
  Prisma,
} from '@prisma/client';
import { PrismaService, transactionStorage } from '../prisma/prisma.service';
import { NotificationDispatcher } from './notification-dispatcher.service';

type NotificationClient = PrismaService | Prisma.TransactionClient;

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  eventKey?: NotificationEventKey | null;
  priority?: NotificationPriority;
  payload?: Record<string, any> | null;
  title?: string | null;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  async createUnique(
    input: CreateNotificationInput,
    client: NotificationClient = this.prisma,
  ) {
    const entityType = input.entityType ?? null;
    const entityId = input.entityId ?? null;
    const eventKey = input.eventKey ?? null;
    const priority = input.priority ?? NotificationPriority.NORMAL;
    const title = input.title || '';
    const body = input.body || '';
    const payload = input.payload ? { version: 1, ...input.payload } : null;

    const existingNotification = await client.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        ...(eventKey ? { eventKey } : title ? { title } : {}),
        entityType,
        entityId,
      },
    });

    if (existingNotification) {
      return existingNotification;
    }

    const notification = await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        eventKey,
        priority,
        payload: payload ? (payload as Prisma.InputJsonValue) : Prisma.JsonNull,
        title,
        body,
        entityType,
        entityId,
      },
    });

    // Check if we are running inside an active Prisma transaction
    const pendingDispatches = transactionStorage.getStore();
    if (pendingDispatches) {
      // Defer dispatching until the transaction commits successfully
      pendingDispatches.push(() => {
        this.dispatcher.dispatch(notification);
      });
    } else {
      // Not in a transaction, dispatch immediately (Fire-and-Forget)
      setImmediate(() => {
        this.dispatcher.dispatch(notification);
      });
    }

    return notification;
  }

  async sendRealtimeNotification(userId: string, notification: any) {
    return this.dispatcher.dispatch(notification);
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        lastPage: Math.ceil(total / safeLimit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async deleteAllNotifications(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
