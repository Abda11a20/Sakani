import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminChatController } from './admin-chat.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { AlertsModule } from '../alerts/alerts.module';
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AdminAccountLifecycleController } from './admin-account-lifecycle.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ChatModule,
    AlertsModule,
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [
    AdminController,
    AdminChatController,
    AdminAccountLifecycleController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
