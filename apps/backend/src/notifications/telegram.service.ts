// apps/backend/src/notifications/telegram.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationType } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    if (!this.botToken) {
      this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN غير مضبوط في متغيرات البيئة.');
    }
  }

  async onModuleInit() {
    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
    const webhookSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    if (this.botToken && webhookUrl) {
      // تأخير 5 ثوانٍ لانتظار استقرار الشبكة بعد بدء الـ container
      await new Promise((r) => setTimeout(r, 5000));
      await this.registerWebhookWithRetry(webhookUrl, webhookSecret);
    } else {
      this.logger.warn(
        '💡 لم يتم ضبط TELEGRAM_WEBHOOK_URL. يرجى تفعيل ngrok وتمرير الرابط العام لربط البوت محلياً.',
      );
    }
  }

  private async registerWebhookWithRetry(
    webhookUrl: string,
    webhookSecret: string | undefined,
    attempts = 3,
  ): Promise<void> {
    const registerUrl = `https://api.telegram.org/bot${this.botToken}/setWebhook`;
    for (let i = 1; i <= attempts; i++) {
      try {
        await axios.post(registerUrl, {
          url: `${webhookUrl}/api/v1/telegram/webhook`,
          secret_token: webhookSecret,
        });
        this.logger.log(
          `🚀 Telegram Webhook registered successfully to: ${webhookUrl}/api/v1/telegram/webhook`,
        );
        return;
      } catch (err: any) {
        const errMsg = err.response?.data?.description ?? err.message;
        if (i < attempts) {
          this.logger.warn(
            `⚠️ Telegram Webhook attempt ${i}/${attempts} failed: ${errMsg}. Retrying in 10s...`,
          );
          await new Promise((r) => setTimeout(r, 10000));
        } else {
          this.logger.error(
            `❌ Failed to register Telegram Webhook after ${attempts} attempts: ${errMsg}`,
          );
        }
      }
    }
  }

  /**
   * إرسال رمز التحقق (OTP)
   */
  async sendOtp(chatId: string, otp: string, type: VerificationType): Promise<void> {
    let messageText = '';

    if (type === VerificationType.EMAIL_VERIFICATION) {
      messageText =
        `🔑 *رمز تفعيل حساب سَكني*\n\n` +
        `رمز التحقق الخاص بك هو: *${otp}*\n` +
        `صلاحية الرمز 10 دقائق.\n\n` +
        `إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.`;
    } else if (type === VerificationType.PASSWORD_RESET) {
      messageText =
        `🔐 *إعادة تعيين كلمة المرور - سَكني*\n\n` +
        `رمز إعادة التعيين الخاص بك هو: *${otp}*\n` +
        `صلاحية الرمز 10 دقائق.\n\n` +
        `يرجى عدم مشاركة هذا الرمز مع أي شخص.`;
    } else {
      messageText =
        `🔑 *رمز التحقق - سَكني*\n\n` +
        `رمز التحقق الخاص بك هو: *${otp}*\n` +
        `صلاحية الرمز 10 دقائق.`;
    }

    await this.sendMessage(chatId, messageText);
  }

  /**
   * إرسال رسالة نصية عامة
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      this.logger.error('❌ فشل إرسال رسالة Telegram: Bot token غير متوفر.');
      return;
    }

    try {
      await axios.post(this.apiUrl, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      });
      this.logger.log(`📱 تم إرسال رسالة Telegram بنجاح إلى chatId: ${chatId}`);
    } catch (error: any) {
      const errMsg = error.response?.data?.description ?? error.message;
      this.logger.error(
        `❌ فشل إرسال رسالة Telegram إلى ${chatId}: ${errMsg}`,
      );
    }
  }
}
