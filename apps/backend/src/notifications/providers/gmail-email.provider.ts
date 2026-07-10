// apps/backend/src/notifications/providers/gmail-email.provider.ts
// مزود البريد عبر Gmail API (OAuth2 / HTTPS) — بديل SMTP المحظور على Hugging Face

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { IEmailProvider, EmailPayload } from '../email-provider.interface';

const MAX_RETRIES = 3;

@Injectable()
export class GmailEmailProvider implements IEmailProvider {
  readonly providerName = 'gmail';
  private readonly logger = new Logger(GmailEmailProvider.name);
  private readonly senderEmail: string;

  // OAuth2 client — يُعاد استخدامه في كل إرسال
  private readonly oauth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const refreshToken = this.config.get<string>('GOOGLE_REFRESH_TOKEN') ?? '';
    this.senderEmail =
      this.config.get<string>('GOOGLE_SENDER_EMAIL') ?? '';

    // إعداد OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.logger.log(
      `📧 Gmail API مُهيَّأ → OAuth2 / HTTPS (sender: ${this.senderEmail})`,
    );
  }

  // ── send ──────────────────────────────────────────────────────────────────────
  async send(payload: EmailPayload): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // بناء رسالة MIME يدوياً وفق RFC 822
        const raw = this.buildRfc822(payload);

        // إنشاء Gmail API client مع إعادة تحديث الـ access token تلقائياً
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });

        this.logger.log(
          `✅ البريد أُرسل عبر Gmail API إلى ${payload.to} | id: ${response.data.id}`,
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

  // ── buildRfc822 ───────────────────────────────────────────────────────────────
  /**
   * يبني رسالة MIME كاملة وفق RFC 822 ثم يُرجعها مُشفَّرة بـ Base64URL
   * كما تتطلبه Gmail API (users.messages.send → raw)
   */
  private buildRfc822(payload: EmailPayload): string {
    const from = `"سَكني | Sakani" <${this.senderEmail}>`;
    const subjectEncoded = this.encodeBase64Header(payload.subject);

    const mime = [
      `From: ${from}`,
      `To: ${payload.to}`,
      `Subject: =?UTF-8?B?${subjectEncoded}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(payload.html, 'utf8').toString('base64'),
    ].join('\r\n');

    // Base64URL (بدون padding) — المطلوب من Gmail API
    return Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // ── encodeBase64Header ────────────────────────────────────────────────────────
  /** يُشفِّر نص الـ Subject بـ Base64 لدعم الأحرف العربية في الـ header */
  private encodeBase64Header(text: string): string {
    return Buffer.from(text, 'utf8').toString('base64');
  }

  // ── sleep ─────────────────────────────────────────────────────────────────────
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
