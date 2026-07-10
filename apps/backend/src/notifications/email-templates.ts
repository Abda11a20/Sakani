// apps/backend/src/notifications/email-templates.ts
// قوالب البريد الإلكتروني بالعربية مع روابط ديناميكية وموائمة للهاتف والألوان

// ── Shared wrappers ───────────────────────────────────────────────────────────

function wrapHtml(title: string, body: string, frontendUrl: string): string {
  // استخدام favicon.png داخل دائرة بيضاء لإظهار الشعار بوضوح وجمالية فائقة
  const logoHtml = `
    <div style="text-align:center;margin-bottom:14px;">
      <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;text-align:center;">
        <tr>
          <td align="center" style="background:#ffffff;border-radius:50%;padding:10px;width:48px;height:48px;box-shadow:0 4px 12px rgba(0,0,0,0.15);text-align:center;vertical-align:middle;">
            <img src="${frontendUrl}/favicon.png" width="48" height="48" alt="Sakany" style="display:block;border-radius:50%;max-width:100%;height:auto;margin:0 auto;outline:none;border:none;"/>
          </td>
        </tr>
      </table>
    </div>
  `;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    /* تحسينات متوافقة مع جميع متصفحات البريد وتضمن التوسيط */
    @media only screen and (max-width: 480px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 10px !important;
      }
      .email-content {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;direction:rtl;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;padding:24px 12px;width:100%;table-layout:fixed;text-align:center;">
    <tr>
      <td align="center" style="text-align:center;vertical-align:top;">
        <!-- Container Card: مدمجة الحجم ومتوسطة العرض لتوافق مثالي -->
        <table align="center" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:440px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(27,79,138,0.06);margin:0 auto;text-align:right;direction:rtl;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B4F8A 0%,#133761 100%);padding:28px 24px;text-align:center;vertical-align:middle;">
              ${logoHtml}
              <h1 style="color:#D4A847;margin:0;font-size:26px;font-weight:900;letter-spacing:1px;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">سَكني</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;letter-spacing:0.5px;">منصة تأجير العقارات في مصر</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-content" style="padding:32px 30px 24px;background:#ffffff;vertical-align:top;">
              <h2 style="color:#1B4F8A;margin:0 0 16px;font-size:20px;font-weight:700;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;border-bottom:2px solid #f4f6f9;padding-bottom:12px;">${title}</h2>
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafbfc;padding:20px 30px;text-align:center;border-top:1px solid #f0f3f6;">
              <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.7;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                إذا لم تطلب هذا البريد يرجى تجاهله تماماً — حسابك بأمان.<br/>
                <span style="color:#1B4F8A;font-weight:700;">فريق عمل سَكني</span> &copy; ${new Date().getFullYear()}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function wrapText(title: string, body: string): string {
  return `${title}\n${'＝'.repeat(15)}\n\n${body}\n\n---\nفريق سَكني`;
}

// ── OTP Box component ─────────────────────────────────────────────────────────

function otpBox(otp: string, color: string, bgColor: string): string {
  return `<div style="background:${bgColor};border:2px dashed ${color};border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
    <span style="font-size:38px;font-weight:900;color:${color};letter-spacing:8px;font-family:monospace,sans-serif;line-height:1;">${otp}</span>
  </div>`;
}

function actionButton(label: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0 0;">
    <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#1B4F8A,#133761);color:#D4A847;text-decoration:none;padding:12px 30px;border-radius:30px;font-size:15px;font-weight:700;box-shadow:0 4px 10px rgba(27,79,138,0.25);">
      ${label}
    </a>
    <p style="color:#94a3b8;font-size:10px;margin:10px 0 0;line-height:1.4;">
      أو انسخ هذا الرابط مباشرة في متصفحك:<br/>
      <a href="${url}" target="_blank" style="color:#1B4F8A;text-decoration:underline;word-break:break-all;">${url}</a>
    </p>
  </div>`;
}

// ── Template Builders ─────────────────────────────────────────────────────────

/**
 * قالب تفعيل الحساب (EMAIL_VERIFICATION)
 */
export function buildVerificationEmail(
  otp: string,
  loginUrl: string,
  expiryMinutes: number,
  frontendUrl: string,
): { html: string; text: string } {
  const title = 'تفعيل حسابك في سَكني';

  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 10px;">
      مرحباً بك في منصة <strong style="color:#1B4F8A;">سَكني</strong>! 🎉
    </p>
    <p style="color:#555d6b;font-size:14px;line-height:1.7;margin:0 0 4px;">
      شكراً لتسجيلك معنا. لتفعيل حسابك، يرجى استخدام رمز التحقق التالي:
    </p>
    ${otpBox(otp, '#1B4F8A', '#f0f6ff')}
    <p style="color:#ef4444;font-size:13px;font-weight:700;margin:0 0 16px;background:#fef2f2;padding:6px 12px;border-radius:6px;display:inline-block;">
      ⏰ هذا الرمز صالح لمدة <strong>${expiryMinutes} دقائق</strong> فقط.
    </p>
    <p style="color:#555d6b;font-size:14px;line-height:1.7;margin:0 0 4px;">
      بإمكانك التفعيل وتسجيل الدخول عبر الزر المباشر أدناه:
    </p>
    ${actionButton('تسجيل الدخول لتفعيل الحساب', loginUrl)}
  `;

  const bodyText = `
مرحباً بك في منصة سَكني!

رمز التحقق الخاص بك هو: ${otp}
الرمز صالح لمدة ${expiryMinutes} دقائق فقط.

رابط تسجيل الدخول المباشر:
${loginUrl}

إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.
  `.trim();

  return {
    html: wrapHtml(title, bodyHtml, frontendUrl),
    text: wrapText(title, bodyText),
  };
}

/**
 * قالب إعادة تعيين كلمة المرور (PASSWORD_RESET)
 */
export function buildPasswordResetEmail(
  otp: string,
  resetUrl: string,
  expiryMinutes: number,
  frontendUrl: string,
): { html: string; text: string } {
  const title = 'طلب إعادة تعيين كلمة المرور';

  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 10px;">
      تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <strong style="color:#1B4F8A;">سَكني</strong>.
    </p>
    <p style="color:#555d6b;font-size:14px;line-height:1.7;margin:0 0 4px;">
      الرجاء استخدام رمز التحقق التالي لإتمام هذه العملية:
    </p>
    ${otpBox(otp, '#dc2626', '#fef2f2')}
    <p style="color:#ef4444;font-size:13px;font-weight:700;margin:0 0 16px;background:#fef2f2;padding:6px 12px;border-radius:6px;display:inline-block;">
      ⏰ هذا الرمز صالح لمدة <strong>${expiryMinutes} دقائق</strong> فقط.
    </p>
    <p style="color:#555d6b;font-size:14px;line-height:1.7;margin:0 0 4px;">
      للمتابعة وتعيين كلمة المرور الجديدة، اضغط على الرابط التالي:
    </p>
    ${actionButton('تعيين كلمة المرور الجديدة', resetUrl)}
    <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;line-height:1.6;border-top:1px solid #f4f6f9;padding-top:12px;">
      🔒 إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا الإيميل وسيظل حسابك آمناً.
    </p>
  `;

  const bodyText = `
إعادة تعيين كلمة المرور — سَكني

تلقّينا طلباً لإعادة تعيين كلمة المرور.

رمز التحقق الخاص بك هو: ${otp}
الرمز صالح لمدة ${expiryMinutes} دقائق فقط.

رابط إعادة التعيين المباشر:
${resetUrl}

إذا لم تطلب هذا، يرجى تجاهل هذا البريد وسيبقى حسابك آمناً تماماً.
  `.trim();

  return {
    html: wrapHtml(title, bodyHtml, frontendUrl),
    text: wrapText(title, bodyText),
  };
}

/**
 * قالب تأكيد تغيير كلمة المرور
 */
export function buildPasswordChangedEmail(
  loginUrl: string,
  frontendUrl: string,
): { html: string; text: string } {
  const title = 'تم تحديث كلمة المرور بنجاح';

  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 10px;">
      ✅ تم تغيير كلمة المرور لحسابك في <strong style="color:#1B4F8A;">سَكني</strong> بنجاح.
    </p>
    <p style="color:#555d6b;font-size:14px;line-height:1.7;margin:0 0 20px;">
      إذا قمت بهذا التغيير بنفسك، فلا داعي لأي خطوات إضافية.
    </p>
    <div style="background:#fffbeb;border-right:4px solid #f59e0b;border-radius:8px;padding:12px 16px;margin:0 0 20px;text-align:right;">
      <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;line-height:1.5;">
        ⚠️ إذا لم تقم بتغيير كلمة المرور، يرجى الاتصال بالدعم الفني فوراً لحظر وتأمين حسابك.
      </p>
    </div>
    ${actionButton('تسجيل الدخول لحسابك', loginUrl)}
  `;

  const bodyText = `
تحديث كلمة المرور — سَكني

تم تحديث كلمة المرور لحسابك بنجاح.
إذا لم تقم بهذا الإجراء، يرجى التواصل مع الدعم الفني فوراً.

رابط تسجيل الدخول:
${loginUrl}
  `.trim();

  return {
    html: wrapHtml(title, bodyHtml, frontendUrl),
    text: wrapText(title, bodyText),
  };
}
