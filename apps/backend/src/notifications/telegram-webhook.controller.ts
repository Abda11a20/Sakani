// apps/backend/src/notifications/telegram-webhook.controller.ts
import { Controller, Post, Body, Headers, UnauthorizedException, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { OtpChannel } from '@prisma/client';

@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-telegram-bot-api-secret-token') secretHeader: string,
    @Body() update: any,
  ) {
    const configuredSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    if (!configuredSecret || secretHeader !== configuredSecret) {
      this.logger.warn('🚫 محاولة وصول غير مصرح بها إلى Webhook الخاص بـ Telegram.');
      throw new UnauthorizedException('Secret token mismatch or not configured.');
    }

    const message = update?.message;
    if (!message || !message.chat || !message.text) {
      return { success: true };
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    try {
      if (text === '/start' || text === '/link') {
        const welcomeText = 
          `👋 مرحباً بك في سَكني!\n\n` +
          `لتفعيل وتلقي رموز التحقق (OTP) عبر تليجرام، يرجى إرسال كود الربط المكون من 6 أرقام الذي يظهر لك في صفحة التسجيل أو الإعدادات على موقع سَكني.`;
        await this.telegramService.sendMessage(chatId, welcomeText);
      } else if (text === '/unlink') {
        // إلغاء الربط
        const user = await this.prisma.user.findFirst({
          where: { telegramChatId: chatId },
        });

        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              otpChannel: OtpChannel.EMAIL,
              telegramChatId: null,
            },
          });
          await this.telegramService.sendMessage(
            chatId,
            `✅ تم إلغاء ربط حسابك بسَكني بنجاح. ستصلك رموز التحقق عبر البريد الإلكتروني من الآن فصاعداً.`,
          );
        } else {
          await this.telegramService.sendMessage(
            chatId,
            `⚠️ لم يتم العثور على حساب مربوط بهذا الرقم في نظام سَكني.`,
          );
        }
      } else if (/^\d{6}$/.test(text)) {
        // كود الربط مكون من 6 أرقام
        const pending = await this.prisma.pendingTelegramLink.findUnique({
          where: { linkCode: text },
        });

        if (!pending) {
          await this.telegramService.sendMessage(
            chatId,
            `❌ رمز الربط غير صحيح أو منتهي الصلاحية. يرجى التأكد من الرمز وإدخاله مجدداً.`,
          );
        } else if (pending.usedAt) {
          await this.telegramService.sendMessage(
            chatId,
            `❌ تم استخدام رمز الربط هذا مسبقاً. يرجى طلب رمز جديد من الموقع.`,
          );
        } else if (pending.expiresAt < new Date()) {
          await this.telegramService.sendMessage(
            chatId,
            `❌ انتهت صلاحية رمز الربط هذا. يرجى طلب رمز جديد من الموقع.`,
          );
        } else {
          // رمز صحيح وصالح للتحديث
          await this.prisma.pendingTelegramLink.update({
            where: { id: pending.id },
            data: {
              chatId,
              linkedAt: new Date(),
            },
          });

          await this.telegramService.sendMessage(
            chatId,
            `✅ تم ربط حسابك بنجاح!\n\n` +
            `يمكنك الآن العودة لموقع سَكني وإكمال الخطوات. ستصلك رموز التحقق هنا بشكل آمن.`,
          );
        }
      } else {
        await this.telegramService.sendMessage(
          chatId,
          `⚠️ عذراً، لم أفهم ذلك. يرجى إرسال رمز الربط المكون من 6 أرقام لربط حسابك، أو إرسال /start للمساعدة.`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Error processing Telegram webhook message: ${err.message}`, err.stack);
    }

    return { success: true };
  }
}
