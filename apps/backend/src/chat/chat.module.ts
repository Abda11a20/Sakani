// apps/backend/src/chat/chat.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { ChatController } from './chat.controller';
import { PusherAuthController } from './pusher-auth.controller';

import { ChatService } from './chat.service';
import { PusherService } from './pusher.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

@Module({
  imports: [
    AuthModule, // يوفر JwtAuthGuard و CurrentUser
  ],
  controllers: [
    ChatController,
    PusherAuthController,
  ],
  providers: [
    PusherService,
    ConversationService,
    MessageService,
    ChatService,
  ],
  exports: [
    PusherService,
    ConversationService,
    MessageService,
    ChatService,
  ],
})
export class ChatModule { }