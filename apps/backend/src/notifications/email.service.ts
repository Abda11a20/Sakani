// apps/backend/src/notifications/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: this.config.get<number>('EMAIL_PORT') || 465,
      secure: true,
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_APP_PASSWORD'),
      },
    });
  }

  // ── قالب مشترك لتغليف كل الرسائل ─────────────────────────────────────────
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

  // ── إرسال كود تفعيل الحساب ───────────────────────────────────────────────
  async sendEmailVerification(email: string, otp: string): Promise<void> {
    const body = `
      <p style="color: #333; font-size: 16px;">مرحباً بك في منصة <strong>سَكني</strong>!</p>
      <p style="color: #555;">لتفعيل حسابك، أدخل الرمز التالي:</p>
      <div style="background: #f0f5ff; border: 2px dashed #1B4F8A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #1B4F8A; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⏰ هذا الرمز صالح لمدة 10 دقائق فقط.</p>
    `;
    await this.send(email, 'تفعيل حساب سَكني', this.wrapTemplate('تفعيل حسابك', body), otp);
  }

  // ── إرسال كود إعادة تعيين كلمة المرور ───────────────────────────────────
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
    await this.send(email, 'إعادة تعيين كلمة مرور سَكني', this.wrapTemplate('إعادة تعيين كلمة المرور', body), otp);
  }

  // ── الدالة الأساسية للإرسال ───────────────────────────────────────────────
  private async send(to: string, subject: string, html: string, devOtp?: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.logger.log(`[TEST MODE] Suppressed email to ${to} with subject "${subject}"`);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // في بيئة التطوير: حاول الإرسال، وإذا فشل اطبع الـ OTP في الكونسول ولا تفشل العملية
      try {
        const info = await this.transporter.sendMail({
          from: `"سَكني | Sakani" <${this.config.get<string>('EMAIL_USER')}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to} | ID: ${info.messageId}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`[DEV] Failed to send email to ${to}: ${message}`);
        if (devOtp) {
          this.logger.warn(
            `\n\n  ╔════════════════════════════════════════╗` +
            `\n  ║  🔑 DEV OTP for ${to.padEnd(25)} ║` +
            `\n  ║       CODE: ${devOtp.padEnd(27)} ║` +
            `\n  ╚════════════════════════════════════════╝\n`
          );
        }
        // في التطوير لا نرمي الخطأ حتى لا نوقف عملية التسجيل
      }
      return;
    }

    // في الإنتاج: نرمي الخطأ حتى تتراجع الـ Transaction وينبه المستخدم
    try {
      const info = await this.transporter.sendMail({
        from: `"سَكني | Sakani" <${this.config.get<string>('EMAIL_USER')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} | ID: ${info.messageId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw new Error(`فشل إرسال البريد الإلكتروني: ${message}`);
    }
  }
}
