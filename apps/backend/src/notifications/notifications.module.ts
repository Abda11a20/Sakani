import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { TelegramService } from './telegram.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { PushController } from './push.controller';
import { PushNotificationService } from './push.service';
import { NotificationDispatcher } from './notification-dispatcher.service';

@Global()
@Module({
  controllers: [NotificationController, TelegramWebhookController, PushController],
  providers: [
    EmailService,
    WhatsappService,
    NotificationService,
    TelegramService,
    PushNotificationService,
    NotificationDispatcher,
  ],
  exports: [
    EmailService,
    WhatsappService,
    NotificationService,
    TelegramService,
    PushNotificationService,
    NotificationDispatcher,
  ],
})
export class NotificationsModule {}
