// apps/backend/src/chat/chat.module.ts

import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Provides JwtAuthGuard and RolesGuard
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
