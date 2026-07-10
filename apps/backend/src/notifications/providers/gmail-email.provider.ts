// apps/backend/src/notifications/providers/gmail-email.provider.ts
// مزود البريد عبر Gmail SMTP (Nodemailer)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailProvider, EmailPayload } from '../email-provider.interface';

const MAX_RETRIES = 3;

@Injectable()
export class GmailEmailProvider implements IEmailProvider {
  readonly providerName = 'gmail';
  private readonly logger = new Logger(GmailEmailProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST') ?? 'smtp.gmail.com';
    const port = parseInt(this.config.get<string>('MAIL_PORT') ?? '587', 10);
    const secure = this.config.get<string>('MAIL_SECURE') === 'true';
    const user = this.config.get<string>('MAIL_USER') ?? '';
    const pass = this.config.get<string>('MAIL_PASSWORD') ?? '';
    this.fromAddress =
      this.config.get<string>('MAIL_FROM') ?? `"سَكني | Sakani" <${user}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      family: 4, // Force IPv4 to avoid ENETUNREACH error on Hugging Face Spaces (IPv6 disabled)
    } as any);

    this.logger.log(`📧 Gmail SMTP مُهيَّأ → ${host}:${port} (secure=${secure})`);
  }

  async send(payload: EmailPayload): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });
        this.logger.log(
          `✅ البريد أُرسل عبر Gmail إلى ${payload.to} | messageId: ${info.messageId}`,
        );
        return; // نجاح — نخرج مباشرة
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // سجّل رسالة آمنة دون كشف بيانات الاعتماد
        this.logger.warn(
          `⚠️ فشل إرسال البريد (محاولة ${attempt}/${MAX_RETRIES}): ${lastError.message}`,
        );

        if (attempt < MAX_RETRIES) {
          // انتظر قبل إعادة المحاولة (exponential back-off بسيط)
          await this.sleep(attempt * 1500);
        }
      }
    }

    // بعد استنفاد المحاولات — نرمي خطأً آمناً
    throw new Error(
      `فشل إرسال البريد الإلكتروني إلى ${payload.to} بعد ${MAX_RETRIES} محاولات.`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
