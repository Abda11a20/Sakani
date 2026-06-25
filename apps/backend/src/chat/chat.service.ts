// apps/backend/src/chat/chat.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import Pusher from 'pusher';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private pusher: Pusher;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Pusher with credentials from environment variables
    this.pusher = new Pusher({
      appId:   process.env.PUSHER_APP_ID!,
      key:     process.env.PUSHER_KEY!,
      secret:  process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS:  true, // Enforce TLS for all connections
    });
  }

  // ── Send a chat message (persisted first, then pushed via Pusher) ──────────
  async sendMessage(senderId: string, dto: SendMessageDto) {
    // Verify receiver exists when a target is specified
    if (dto.receiverId) {
      const receiver = await this.prisma.user.findUnique({
        where: { id: dto.receiverId },
      });
      if (!receiver) {
        throw new NotFoundException('Receiver not found');
      }
    }

    // Persist the message to the database before broadcasting
    const message = await this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId: dto.receiverId ?? null,
        content:    dto.content,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    // Determine the Pusher channels:
    // - User's personal channel: private-chat-user-{userId}
    // - Support admin channel: private-support
    const channels: string[] = [];
    
    // Always trigger to the sender's channel so their UI can update if needed
    channels.push(`private-chat-user-${senderId}`);

    if (dto.receiverId) {
      // Direct message: trigger to receiver's channel
      channels.push(`private-chat-user-${dto.receiverId}`);
    } else {
      // Support message: trigger to admin support channel
      channels.push('private-support');
    }

    // Trigger the real-time event on all channels
    // We can use pusher.trigger with an array of channels (max 100)
    await this.pusher.trigger(channels, 'new-message', {
      id:         message.id,
      content:    message.content,
      sender:     message.sender,
      receiverId: message.receiverId,
      createdAt:  message.createdAt,
    });

    return { message: 'Message sent', data: message };
  }

  // ── Retrieve conversation history between two users ────────────────────────
  async getConversation(
    userAId: string,
    userBId: string,
    page: number = 1,
    limit: number = 30,
  ) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userAId, receiverId: userBId },
            { senderId: userBId, receiverId: userAId },
          ],
        },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.chatMessage.count({
        where: {
          OR: [
            { senderId: userAId, receiverId: userBId },
            { senderId: userBId, receiverId: userAId },
          ],
        },
      }),
    ]);

    return {
      messages: messages.reverse(), // Chronological order for frontend
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // ── Retrieve support messages (admin-facing inbox) ─────────────────────────
  async getSupportMessages(page: number = 1, limit: number = 30) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where:   { receiverId: null },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
        },
      }),
      this.prisma.chatMessage.count({ where: { receiverId: null } }),
    ]);

    return {
      messages: messages.reverse(),
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // ── Mark messages as read ──────────────────────────────────────────────────
  async markAsRead(currentUserId: string, senderId: string) {
    await this.prisma.chatMessage.updateMany({
      where: {
        senderId,
        receiverId: currentUserId,
        isRead:     false,
      },
      data: { isRead: true },
    });

    return { message: 'Messages marked as read' };
  }

  // ── Get unread message count for a user ───────────────────────────────────
  async getUnreadCount(userId: string) {
    const count = await this.prisma.chatMessage.count({
      where: { receiverId: userId, isRead: false },
    });

    return { unreadCount: count };
  }
}
