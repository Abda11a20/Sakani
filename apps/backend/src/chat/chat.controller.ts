// apps/backend/src/chat/chat.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  // ── Get or create own support conversation ────────────────────────────────
  @Get('support/me')
  async getSupportConversation(@CurrentUser() user: SafeUser) {
    return this.conversationService.findOrCreateSupportConversation(user.id);
  }

  // ── Get paginated messages for a conversation ─────────────────────────────
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.messageService.getMessages(conversationId, user.id, page, limit);
  }

  // ── Send a message to a conversation ──────────────────────────────────────
  @Post('messages')
  async sendMessage(
    @CurrentUser() user: SafeUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.sendMessage(user.id, dto.conversationId, dto.content);
  }

  // ── Mark conversation as read ─────────────────────────────────────────────
  @Patch('conversations/:id/read')
  async markAsRead(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
  ) {
    return this.messageService.markAsRead(conversationId, user.id);
  }

  // ── Get total unread count for current user ───────────────────────────────
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: SafeUser) {
    return this.messageService.getUnreadCount(user.id);
  }
}
