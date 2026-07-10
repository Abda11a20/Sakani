// apps/backend/src/notifications/email-provider.interface.ts
// واجهة مزود البريد الإلكتروني — Provider Interface

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  /**
   * اسم المزود (gmail | resend) يُستخدم في السجلات
   */
  readonly providerName: string;

  /**
   * إرسال بريد إلكتروني واحد
   * يُعيد void في حالة النجاح
   * يرمي خطأً في حالة الفشل
   */
  send(payload: EmailPayload): Promise<void>;
}
