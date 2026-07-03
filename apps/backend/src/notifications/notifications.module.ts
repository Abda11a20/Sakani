import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [EmailService, WhatsappService, NotificationService],
  exports: [EmailService, WhatsappService, NotificationService],
})
export class NotificationsModule {}
