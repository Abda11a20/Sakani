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
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ── Send a message (any authenticated user) ───────────────────────────────
  @Post('send')
  async sendMessage(
    @CurrentUser() user: SafeUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, dto);
  }

  // ── Get DM conversation with another user ─────────────────────────────────
  @Get('conversation/:userId')
  async getConversation(
    @CurrentUser() user: SafeUser,
    @Param('userId') otherUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getConversation(user.id, otherUserId, page, limit);
  }

  // ── Get all support messages — admin inbox ─────────────────────────────────
  @Get('support')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  async getSupportMessages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getSupportMessages(page, limit);
  }

  // ── Mark all messages from a sender as read ───────────────────────────────
  @Patch('read/:senderId')
  async markAsRead(
    @CurrentUser() user: SafeUser,
    @Param('senderId') senderId: string,
  ) {
    return this.chatService.markAsRead(user.id, senderId);
  }

  // ── Get unread message count for the current user ─────────────────────────
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: SafeUser) {
    return this.chatService.getUnreadCount(user.id);
  }
}
