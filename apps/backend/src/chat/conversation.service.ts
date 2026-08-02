// apps/backend/src/chat/conversation.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from './pusher.service';
import {
  ConversationType,
  ParticipantRole,
  ConversationStatus,
  ChatBlockReason,
} from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusherService: PusherService,
  ) {}

  async findOrCreateSupportConversation(userId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.SUPPORT,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.SUPPORT,
        participants: {
          create: [
            {
              userId,
              role: ParticipantRole.USER,
            },
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
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findOrCreatePrivateConversation(user1Id: string, user2Id: string) {
    if (user1Id === user2Id) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.PRIVATE,
        AND: [
          { participants: { some: { userId: user1Id } } },
          { participants: { some: { userId: user2Id } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.PRIVATE,
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
                phone: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getConversationDetails(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
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
                    phone: true,
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
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        return this.prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        });
      }
      throw new ForbiddenException('Not authorized to view this conversation');
    }

    return participant.conversation;
  }

  async getSupportConversations(
    adminId: string,
    page: number = 1,
    limit: number = 30,
    status?: string,
    reason?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      type: ConversationType.SUPPORT,
    };

    if (status === 'blocked') {
      whereClause.blockedAt = { not: null };
    } else if (status === 'active') {
      whereClause.blockedAt = null;
    }

    if (reason) {
      whereClause.blockReason = reason;
    }

    if (search) {
      const trimmed = search.trim();
      whereClause.participants = {
        some: {
          user: {
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' } },
              { phone: { contains: trimmed, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: whereClause,
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
                  phone: true,
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
        where: whereClause,
      }),
    ]);

    const mapped = await Promise.all(
      conversations.map(async (conv) => {
        const clientPart = conv.participants.find(
          (p) => p.role === ParticipantRole.USER,
        );
        const clientUser = clientPart ? clientPart.user : null;

        const adminPart = conv.participants.find((p) => p.userId === adminId);
        const lastReadAt = adminPart ? adminPart.lastReadAt : new Date(0);

        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: adminId },
            createdAt: { gt: lastReadAt },
          },
        });

        // Event-sourced block count from Audit Moderation Logs
        let blockCount = 1;
        try {
          blockCount = await this.prisma.chatModerationLog.count({
            where: { conversationId: conv.id, action: 'BLOCK' },
          });
        } catch {
          blockCount = 1;
        }

        let blockedByUser: any = null;
        if (conv.blockedBy) {
          blockedByUser = await this.prisma.user.findUnique({
            where: { id: conv.blockedBy },
            select: { id: true, name: true, role: true },
          });
        }

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
          blockedByUser,
          blockReason: conv.blockReason,
          blockCount,
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

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChatBlockReason') THEN
            CREATE TYPE "ChatBlockReason" AS ENUM ('SPAM', 'ABUSE', 'THREATS', 'EXTERNAL_LINKS', 'INAPPROPRIATE_CONTENT', 'MANUAL');
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS "chat_moderation_logs" (
          "id" TEXT NOT NULL,
          "conversationId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "reason" "ChatBlockReason",
          "note" TEXT,
          "adminId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "chat_moderation_logs_pkey" PRIMARY KEY ("id")
        );
      `);
    } catch (err: any) {
      console.warn('[ConversationService] chat_moderation_logs DDL notice:', err?.message || err);
    }
  }

  async blockConversation(
    conversationId: string,
    adminId: string,
    reason?: string,
    note?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const effectiveReason = (reason as ChatBlockReason) || ChatBlockReason.MANUAL;
    const reasonText = note ? `${effectiveReason}: ${note}` : effectiveReason;

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        blockedAt: new Date(),
        blockedBy: adminId,
        blockReason: reasonText,
      },
    });

    // Record Event-Sourced Moderation Log with safety catch
    try {
      await this.prisma.chatModerationLog.create({
        data: {
          conversationId,
          action: 'BLOCK',
          reason: effectiveReason,
          note: note || null,
          adminId,
        },
      });
    } catch (err: any) {
      console.warn('[ConversationService] Log creation deferred:', err?.message || err);
    }

    // System Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'CHAT_CONVERSATION_BLOCKED',
          entity: 'Conversation',
          entityId: conversationId,
        },
      });
    } catch (err: any) {
      console.warn('[ConversationService] AuditLog creation deferred:', err?.message || err);
    }

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

  async unblockConversation(conversationId: string, adminId?: string) {
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

    if (adminId) {
      try {
        await this.prisma.chatModerationLog.create({
          data: {
            conversationId,
            action: 'UNBLOCK',
            adminId,
          },
        });
      } catch (err: any) {
        console.warn('[ConversationService] Unblock log deferred:', err?.message || err);
      }

      try {
        await this.prisma.auditLog.create({
          data: {
            adminId,
            action: 'CHAT_CONVERSATION_UNBLOCKED',
            entity: 'Conversation',
            entityId: conversationId,
          },
        });
      } catch (err: any) {
        console.warn('[ConversationService] Unblock AuditLog deferred:', err?.message || err);
      }
    }

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

  async ensureParticipant(
    conversationId: string,
    userId: string,
    role: ParticipantRole = ParticipantRole.USER,
  ) {
    const existing = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!existing) {
      await this.prisma.conversationParticipant.create({
        data: {
          conversationId,
          userId,
          role,
        },
      });
    }
  }
}
