// apps/backend/src/chat/conversation.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from './pusher.service';
import { ParticipantRole, ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusherService: PusherService,
  ) {}

  async findOrCreateSupportConversation(userId: string) {
    // Find if user already has a support conversation
    let participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversation: {
          type: 'SUPPORT',
        },
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      // Create new SUPPORT conversation
      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'SUPPORT',
          status: 'ACTIVE',
          participants: {
            create: [{ userId, role: ParticipantRole.USER }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Broadcast conversation creation event (optional, for admins)
      await this.pusherService.broadcastToConversation(
        conversation.id,
        'conversation.created',
        {
          id: conversation.id,
          type: conversation.type,
          status: conversation.status,
        },
      );

      return conversation;
    }

    return participant.conversation;
  }

  async getSupportConversations(
    adminId: string,
    page: number = 1,
    limit: number = 30,
  ) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { type: 'SUPPORT' },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.conversation.count({
        where: { type: 'SUPPORT' },
      }),
    ]);

    const mapped = await Promise.all(
      conversations.map(async (conv) => {
        // Find client participant (the client user)
        const clientPart = conv.participants.find(
          (p) => p.role === ParticipantRole.USER,
        );
        const clientUser = clientPart ? clientPart.user : null;

        // Find admin participant to get lastReadAt
        const adminPart = conv.participants.find((p) => p.userId === adminId);
        const lastReadAt = adminPart ? adminPart.lastReadAt : new Date(0);

        // Fetch unread count for admin
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: adminId },
            createdAt: { gt: lastReadAt },
          },
        });

        // Fetch last message details if lastMessageId exists
        let lastMessage: any = null;
        if (conv.lastMessageId) {
          lastMessage = await this.prisma.chatMessage.findUnique({
            where: { id: conv.lastMessageId },
            include: {
              sender: {
                select: { id: true, name: true, avatarUrl: true, role: true },
              },
            },
          });
        }

        return {
          id: conv.id,
          type: conv.type,
          status: conv.status,
          blockedAt: conv.blockedAt,
          blockedBy: conv.blockedBy,
          blockReason: conv.blockReason,
          lastMessageId: conv.lastMessageId,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          clientUser,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return {
      conversations: mapped,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async blockConversation(
    conversationId: string,
    adminId: string,
    reason: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        blockedAt: new Date(),
        blockedBy: adminId,
        blockReason: reason,
      },
    });

    // Notify all listeners
    await this.pusherService.broadcastToConversation(
      conversationId,
      'conversation.updated',
      {
        id: updated.id,
        status: updated.status,
        blockedAt: updated.blockedAt,
        blockedBy: updated.blockedBy,
        blockReason: updated.blockReason,
      },
    );

    return { success: true, conversation: updated };
  }

  async unblockConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        blockedAt: null,
        blockedBy: null,
        blockReason: null,
      },
    });

    // Notify all listeners
    await this.pusherService.broadcastToConversation(
      conversationId,
      'conversation.updated',
      {
        id: updated.id,
        status: updated.status,
        blockedAt: null,
        blockedBy: null,
        blockReason: null,
      },
    );

    return { success: true, conversation: updated };
  }

  async findOrCreatePrivateConversation(user1Id: string, user2Id: string) {
    // Find if there is an existing PRIVATE conversation with both users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        participants: {
          every: {
            userId: { in: [user1Id, user2Id] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Check if it really has both participants (exact count 2)
    if (existing && existing.participants.length === 2) {
      return existing;
    }

    // Create a new PRIVATE conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'PRIVATE',
        status: 'ACTIVE',
        participants: {
          create: [
            { userId: user1Id, role: ParticipantRole.USER },
            { userId: user2Id, role: ParticipantRole.USER },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  async getConversationDetails(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const isPart = conversation.participants.some((p) => p.userId === userId);
    if (!isPart && !isAdmin) {
      throw new ForbiddenException('Not authorized to view this conversation');
    }

    return conversation;
  }

  async ensureParticipant(
    conversationId: string,
    userId: string,
    role: ParticipantRole = ParticipantRole.USER,
  ) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      return this.prisma.conversationParticipant.create({
        data: {
          conversationId,
          userId,
          role,
        },
      });
    }

    return participant;
  }
}
