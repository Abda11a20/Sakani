// apps/backend/src/chat/pusher-auth.controller.ts

import {
  Body,
  Controller,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PusherService } from './pusher.service';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat/pusher')
@UseGuards(JwtAuthGuard)
export class PusherAuthController {
  constructor(
    private readonly pusherService: PusherService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('auth')
  async authenticate(
    @CurrentUser() user: SafeUser,
    @Body()
    body: {
      socket_id: string;
      channel_name: string;
    },
  ) {
    // Channel format: private-conversation-{conversationId}
    const match = body.channel_name.match(/^private-conversation-(.+)$/);
    if (!match) {
      throw new ForbiddenException('Invalid channel format');
    }

    const conversationId = match[1];

    // Check if conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Conversation not found');
    }

    // Access granted if user is participant OR is admin/super_admin
    const isParticipant = conversation.participants.some(p => p.userId === user.id);
    const isAdmin = user.role === UserRole.admin || user.role === UserRole.super_admin;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Access denied to this conversation channel');
    }

    return this.pusherService.authorizeChannel(body.socket_id, body.channel_name);
  }
}