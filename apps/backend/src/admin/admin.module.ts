// apps/backend/src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminChatController } from './admin-chat.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { AlertsModule } from '../alerts/alerts.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [AuthModule, UsersModule, ChatModule, AlertsModule, UploadsModule],
  controllers: [AdminController, AdminChatController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
