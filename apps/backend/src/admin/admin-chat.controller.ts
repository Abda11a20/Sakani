// apps/backend/src/admin/admin-chat.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationService } from '../chat/conversation.service';
import { MessageService } from '../chat/message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole, ChatBlockReason } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Admin Chat')
@ApiBearerAuth()
@Controller('admin/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminChatController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  // ── Get support conversations list (Inbox summaries) ──────────────────────
  @Get('conversations')
  async getSupportConversations(
    @CurrentUser() admin: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('reason') reason?: string,
    @Query('search') search?: string,
  ) {
    return this.conversationService.getSupportConversations(
      admin.id,
      page,
      limit,
      status,
      reason,
      search,
    );
  }

  // ── Get messages for a support conversation ───────────────────────────────
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @CurrentUser() admin: SafeUser,
    @Param('id') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.messageService.getMessages(
      conversationId,
      admin.id,
      page,
      limit,
    );
  }

  // ── Block conversation ───────────────────────────────────────────────────
  @Post('conversations/:id/block')
  async blockConversation(
    @CurrentUser() admin: SafeUser,
    @Param('id') conversationId: string,
    @Body('reason') reason?: ChatBlockReason,
    @Body('note') note?: string,
  ) {
    return this.conversationService.blockConversation(
      conversationId,
      admin.id,
      reason,
      note,
    );
  }

  // ── Unblock conversation ─────────────────────────────────────────────────
  @Post('conversations/:id/unblock')
  async unblockConversation(
    @CurrentUser() admin: SafeUser,
    @Param('id') conversationId: string,
  ) {
    return this.conversationService.unblockConversation(conversationId, admin.id);
  }
}
