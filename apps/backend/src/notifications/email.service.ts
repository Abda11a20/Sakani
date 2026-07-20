// apps/backend/src/notifications/email.service.ts
// خدمة البريد الإلكتروني — تعتمد على IEmailProvider فقط (SOLID)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from './email-provider.interface';
import { GmailEmailProvider } from './providers/gmail-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildPasswordChangedEmail,
} from './email-templates';

// مدة صلاحية الـ OTP (تطابق ما هو مُعرَّف في auth.service.ts: OTP_EXPIRY_MINUTES = 10)
const OTP_EXPIRY_MINUTES = 10;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: IEmailProvider;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    // اختيار المزود بناءً على متغير البيئة EMAIL_PROVIDER
    const emailProvider =
      this.config.get<string>('EMAIL_PROVIDER')?.toLowerCase() ?? 'gmail';

    if (emailProvider === 'resend') {
      this.provider = new ResendEmailProvider(config);
    } else {
      // الافتراضي: Gmail SMTP
      this.provider = new GmailEmailProvider(config);
    }

    this.logger.log(
      `📧 مزود البريد النشط: ${this.provider.providerName.toUpperCase()}`,
    );
  }

  // ── Public API (لا يتغير — متوافق مع جميع الاستدعاءات الحالية) ─────────────

  /** إرسال كود تفعيل الحساب */
  async sendEmailVerification(email: string, otp: string): Promise<void> {
    const loginUrl = `${this.frontendUrl}/ar/login`;
    const { html, text } = buildVerificationEmail(
      otp,
      loginUrl,
      OTP_EXPIRY_MINUTES,
      this.frontendUrl,
    );

    await this.dispatch(
      {
        to: email,
        subject: 'تفعيل حساب سَكني — رمز التحقق',
        html,
        text,
      },
      otp,
    );
  }

  /** إرسال كود إعادة تعيين كلمة المرور */
  async sendPasswordReset(email: string, otp: string): Promise<void> {
    // رابط يوجه لصفحة إعادة التعيين مع الإيميل كـ query param
    const resetUrl = `${this.frontendUrl}/ar/reset-password?email=${encodeURIComponent(email)}`;
    const { html, text } = buildPasswordResetEmail(
      otp,
      resetUrl,
      OTP_EXPIRY_MINUTES,
      this.frontendUrl,
    );

    await this.dispatch(
      {
        to: email,
        subject: 'إعادة تعيين كلمة مرور سَكني',
        html,
        text,
      },
      otp,
    );
  }

  /** إرسال تأكيد تغيير كلمة المرور */
  async sendPasswordChangedConfirmation(email: string): Promise<void> {
    const loginUrl = `${this.frontendUrl}/ar/login`;
    const { html, text } = buildPasswordChangedEmail(
      loginUrl,
      this.frontendUrl,
    );

    await this.dispatch({
      to: email,
      subject: 'تم تغيير كلمة المرور — سَكني',
      html,
      text,
    });
  }

  // ── Private: Dispatcher ────────────────────────────────────────────────────

  private async dispatch(
    payload: { to: string; subject: string; html: string; text?: string },
    devOtp?: string,
  ): Promise<void> {
    // في بيئة الاختبار: لا نرسل شيئاً
    if (process.env.NODE_ENV === 'test') {
      this.logger.log(`[TEST] تم إلغاء البريد إلى ${payload.to}`);
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    try {
      await this.provider.send(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';

      // نسجّل الخطأ دائماً بغض النظر عن البيئة
      this.logger.error(`❌ فشل إرسال البريد إلى ${payload.to}: ${message}`);

      // في بيئة التطوير: نطبع الـ OTP لتسهيل الاختبار
      if (!isProduction && devOtp) {
        this.logger.warn(
          `\n\n  ╔════════════════════════════════════════╗` +
            `\n  ║  🔑 DEV OTP for ${payload.to.padEnd(24)} ║` +
            `\n  ║       CODE: ${devOtp.padEnd(27)} ║` +
            `\n  ╚════════════════════════════════════════╝\n`,
        );
      }

      // لا نرمي خطأً — الكود محفوظ في قاعدة البيانات بالفعل
      // رمي الخطأ هنا كان يُظهر "حدث خطأ" للمستخدم رغم أن الـ OTP تم إنشاؤه بنجاح
    }
  }
}
