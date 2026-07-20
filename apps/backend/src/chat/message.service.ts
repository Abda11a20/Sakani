// apps/backend/src/chat/message.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from './pusher.service';
import { ConversationService } from './conversation.service';
import { ParticipantRole } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusherService: PusherService,
    private readonly conversationService: ConversationService,
  ) {}

  async sendMessage(senderId: string, conversationId: string, content: string) {
    // 1. Fetch conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 2. Fetch sender details
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const isAdmin = sender.role === 'admin' || sender.role === 'super_admin';

    // 3. Check if conversation is blocked
    if (conversation.blockedAt && !isAdmin) {
      throw new ForbiddenException(
        conversation.blockReason
          ? `تم حظر هذه المحادثة من قِبل الإدارة. السبب: ${conversation.blockReason}`
          : 'تم حظر هذه المحادثة من قِبل الإدارة.',
      );
    }

    // 4. Ensure participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === senderId,
    );
    if (!isParticipant) {
      if (isAdmin) {
        // Automatically add admin as SUPPORT participant
        await this.conversationService.ensureParticipant(
          conversationId,
          senderId,
          ParticipantRole.SUPPORT,
        );
      } else {
        throw new ForbiddenException(
          'You are not a participant in this conversation',
        );
      }
    }

    // 5. Create Message
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // 6. Update Conversation last message indicators
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        updatedAt: new Date(),
      },
    });

    // 7. Update lastReadAt for the sender (they read their own message)
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
      data: {
        lastReadAt: message.createdAt,
      },
    });

    // 8. Broadcast via PusherService
    await this.pusherService.broadcastToConversation(
      conversationId,
      'message.created',
      {
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
      },
    );

    return message;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 30,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    // Verify user participates in the conversation or is admin
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant && !isAdmin) {
      throw new ForbiddenException(
        'Not authorized to view messages in this conversation',
      );
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
        },
      }),
      this.prisma.chatMessage.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages: messages.reverse(), // Chronological order for frontend
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      // If admin, auto-join as SUPPORT to allow read tracking
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        await this.conversationService.ensureParticipant(
          conversationId,
          userId,
          ParticipantRole.SUPPORT,
        );
      } else {
        throw new NotFoundException('Participant not found');
      }
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Notify other conversation members of read event
    await this.pusherService.broadcastToConversation(
      conversationId,
      'message.read',
      {
        userId,
        readAt: new Date(),
      },
    );

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    let totalUnread = 0;
    if (participants.length > 0) {
      const counts = await Promise.all(
        participants.map((p) =>
          this.prisma.chatMessage.count({
            where: {
              conversationId: p.conversationId,
              senderId: { not: userId },
              createdAt: { gt: p.lastReadAt },
            },
          }),
        ),
      );
      totalUnread = counts.reduce((sum, count) => sum + count, 0);
    }

    return { unreadCount: totalUnread };
  }
}
