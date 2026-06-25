import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';

@Global()
@Module({
  providers: [EmailService, WhatsappService],
  exports: [EmailService, WhatsappService],
})
export class NotificationsModule {}
