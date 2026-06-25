// apps/backend/src/notifications/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as nodemailer from 'nodemailer';

// ── Types ────────────────────────────────────────────────────────────────────
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

type EmailProvider = 'resend' | 'smtp';

// ── EmailService ─────────────────────────────────────────────────────────────
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;
  private readonly resendApiKey: string | undefined;
  private readonly resendFrom: string;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.resendApiKey = this.config.get<string>('RESEND_API_KEY');
    this.resendFrom = this.config.get<string>('RESEND_FROM') || 'سَكني | Sakani <onboarding@resend.dev>';

    if (this.resendApiKey) {
      this.provider = 'resend';
      this.logger.log('📧 Email provider: Resend API');
    } else {
      this.provider = 'smtp';
      this.logger.log('📧 Email provider: SMTP (Nodemailer)');
      this.smtpTransporter = nodemailer.createTransport({
        host: this.config.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
        port: this.config.get<number>('EMAIL_PORT') || 465,
        secure: true,
        auth: {
          user: this.config.get<string>('EMAIL_USER'),
          pass: this.config.get<string>('EMAIL_APP_PASSWORD'),
        },
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** إرسال كود تفعيل الحساب */
  async sendEmailVerification(email: string, otp: string): Promise<void> {
    const body = `
      <p style="color: #333; font-size: 16px;">مرحباً بك في منصة <strong>سَكني</strong>!</p>
      <p style="color: #555;">لتفعيل حسابك، أدخل الرمز التالي:</p>
      <div style="background: #f0f5ff; border: 2px dashed #1B4F8A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #1B4F8A; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⏰ هذا الرمز صالح لمدة 10 دقائق فقط.</p>
    `;
    const html = this.wrapTemplate('تفعيل حسابك', body);
    await this.dispatch({ to: email, subject: 'تفعيل حساب سَكني', html }, otp);
  }

  /** إرسال كود إعادة تعيين كلمة المرور */
  async sendPasswordReset(email: string, otp: string): Promise<void> {
    const body = `
      <p style="color: #333; font-size: 16px;">تلقينا طلب لإعادة تعيين كلمة المرور لحسابك.</p>
      <p style="color: #555;">استخدم الرمز التالي لإعادة تعيين كلمة المرور:</p>
      <div style="background: #fff5f5; border: 2px dashed #e74c3c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #e74c3c; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⏰ هذا الرمز صالح لمدة 10 دقائق فقط.</p>
      <p style="color: #888; font-size: 13px;">إذا لم تكن قد طلبت هذا، فلا داعي للقلق — حسابك بأمان تام.</p>
    `;
    const html = this.wrapTemplate('إعادة تعيين كلمة المرور', body);
    await this.dispatch({ to: email, subject: 'إعادة تعيين كلمة مرور سَكني', html }, otp);
  }

  // ── Private: Dispatch (routes to the active provider) ──────────────────────

  private async dispatch(payload: EmailPayload, devOtp?: string): Promise<void> {
    // في بيئة الاختبار: لا نرسل شيئاً
    if (process.env.NODE_ENV === 'test') {
      this.logger.log(`[TEST] Suppressed email to ${payload.to}`);
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    try {
      if (this.provider === 'resend') {
        await this.sendViaResend(payload);
      } else {
        await this.sendViaSmtp(payload);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (isProduction) {
        // في الإنتاج: نرمي الخطأ لإلغاء الـ Transaction بالكامل
        this.logger.error(`❌ Failed to send email to ${payload.to}: ${message}`);
        throw new Error(`فشل إرسال البريد الإلكتروني: ${message}`);
      }

      // في التطوير: نطبع الـ OTP في الكونسول ونكمل العملية
      this.logger.warn(`[DEV] Email to ${payload.to} failed: ${message}`);
      if (devOtp) {
        this.logger.warn(
          `\n\n  ╔════════════════════════════════════════╗` +
          `\n  ║  🔑 DEV OTP for ${payload.to.padEnd(25)} ║` +
          `\n  ║       CODE: ${devOtp.padEnd(27)} ║` +
          `\n  ╚════════════════════════════════════════╝\n`,
        );
      }
    }
  }

  // ── Private: Resend API Transport ──────────────────────────────────────────

  private async sendViaResend(payload: EmailPayload): Promise<void> {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: this.resendFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      },
      {
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    );

    this.logger.log(`✅ Email sent via Resend to ${payload.to} | ID: ${response.data?.id}`);
  }

  // ── Private: SMTP (Nodemailer) Transport ───────────────────────────────────

  private async sendViaSmtp(payload: EmailPayload): Promise<void> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter is not configured');
    }

    const info = await this.smtpTransporter.sendMail({
      from: `"سَكني | Sakani" <${this.config.get<string>('EMAIL_USER')}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    this.logger.log(`✅ Email sent via SMTP to ${payload.to} | ID: ${info.messageId}`);
  }

  // ── Private: HTML Email Template ───────────────────────────────────────────

  private wrapTemplate(title: string, body: string): string {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fc; padding: 20px;">
        <div style="background: #1B4F8A; padding: 20px 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #D4A847; margin: 0; font-size: 28px;">سَكني</h1>
          <p style="color: #ffffff; margin: 5px 0 0; font-size: 14px;">منصة تأجير العقارات في مصر</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1B4F8A; margin-top: 0;">${title}</h2>
          ${body}
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            إذا لم تكن قد طلبت هذا الإيميل، يرجى تجاهله تماماً.<br/>
            فريق سَكني &mdash; جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `;
  }
}
