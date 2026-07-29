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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, MessageType } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import { UploadsService } from '../uploads/uploads.service';
import * as path from 'path';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ── Get or create own support conversation ────────────────────────────────
  @Get('support/me')
  async getSupportConversation(@CurrentUser() user: SafeUser) {
    return this.conversationService.findOrCreateSupportConversation(user.id);
  }

  // ── Get or create private conversation ─────────────────────────────────────
  @Post('conversations/private')
  async getOrCreatePrivateConversation(
    @CurrentUser() user: SafeUser,
    @Body('userId') recipientId: string,
  ) {
    return this.conversationService.findOrCreatePrivateConversation(
      user.id,
      recipientId,
    );
  }

  // ── Get conversation details ──────────────────────────────────────────────
  @Get('conversations/:id')
  async getConversationDetails(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
  ) {
    return this.conversationService.getConversationDetails(
      conversationId,
      user.id,
    );
  }

  // ── Get paginated messages for a conversation ─────────────────────────────
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.messageService.getMessages(
      conversationId,
      user.id,
      page,
      limit,
    );
  }

  // ── Send a message to a conversation ──────────────────────────────────────
  @Post('messages')
  async sendMessage(
    @CurrentUser() user: SafeUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.sendMessage(
      user.id,
      dto.conversationId,
      dto.content,
    );
  }

  // ── Upload Chat Image Attachment ──────────────────────────────────────────
  @Post('conversations/:id/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('يجب إرفاق ملف صورة');
    }

    // 1. File size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
    }

    // 2. Extension check (Strict whitelist - NO SVG!)
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('نوع الملف غير مسموح به. يرجى رفع صورة JPG أو PNG أو WEBP فقط.');
    }

    // 3. MIME type check
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('صيغة الصورة غير مدعومة.');
    }

    // 4. Magic Bytes Validation
    const buf = file.buffer;
    const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isWebp = buf.length >= 12 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('الملف المرفق ليس صورة صالحة (فشل التحقق الأمني من محتوى الملف).');
    }

    // 5. Upload file via UploadsService to Cloudinary / Storage
    const uploadRes = await this.uploadsService.uploadChatAttachment(user.id, file);

    // 6. Automatically create ChatMessage with type IMAGE
    return this.messageService.sendMessage(
      user.id,
      conversationId,
      uploadRes.url,
      MessageType.IMAGE,
    );
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

  // ── Notify typing status ──────────────────────────────────────────────────
  @Post('conversations/:id/typing')
  async notifyTyping(
    @CurrentUser() user: SafeUser,
    @Param('id') conversationId: string,
    @Body('isTyping') isTyping: boolean,
  ) {
    return this.messageService.notifyTyping(
      conversationId,
      user.id,
      isTyping ?? true,
    );
  }
}
