// apps/backend/src/notifications/providers/resend-email.provider.ts
// مزود البريد عبر Resend API — يلف الكود الحالي (لا يُحذف)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IEmailProvider, EmailPayload } from '../email-provider.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  readonly providerName = 'resend';
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly apiKey: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.from =
      this.config.get<string>('RESEND_FROM') ??
      'سَكني | Sakani <onboarding@resend.dev>';

    this.logger.log('📧 Resend API مُهيَّأ');
  }

  async send(payload: EmailPayload): Promise<void> {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: this.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    );

    this.logger.log(
      `✅ البريد أُرسل عبر Resend إلى ${payload.to} | id: ${response.data?.id}`,
    );
  }
}
