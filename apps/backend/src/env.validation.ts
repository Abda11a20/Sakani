import { z } from 'zod';

export const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    PORT: z.string().optional().default('3001'),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    // مفتاح تشفير الرقم القومي (AES-256) - مطلوب
    ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY يجب أن يكون على الأقل 16 حرفاً'),

    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().optional(),
    // Email provider selector
    EMAIL_PROVIDER: z.enum(['gmail', 'resend']).default('gmail'),
    // Gmail API OAuth2 (used when EMAIL_PROVIDER=gmail on platforms where SMTP is blocked)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REFRESH_TOKEN: z.string().optional(),
    GOOGLE_SENDER_EMAIL: z.string().optional(),
    // Gmail SMTP
    MAIL_HOST: z.string().default('smtp.gmail.com'),
    MAIL_PORT: z.string().default('587'),
    MAIL_SECURE: z.string().default('false'),
    MAIL_USER: z.string().optional(),
    MAIL_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    STORAGE_PROVIDER: z.enum(['s3', 'cloudinary']).default('s3'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
    TELEGRAM_WEBHOOK_URL: z.string().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.STORAGE_PROVIDER === 'cloudinary') {
      if (!data.CLOUDINARY_CLOUD_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_CLOUD_NAME is required when STORAGE_PROVIDER is cloudinary',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
      if (!data.CLOUDINARY_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_KEY is required when STORAGE_PROVIDER is cloudinary',
          path: ['CLOUDINARY_API_KEY'],
        });
      }
      if (!data.CLOUDINARY_API_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_SECRET is required when STORAGE_PROVIDER is cloudinary',
          path: ['CLOUDINARY_API_SECRET'],
        });
      }
    }
  });

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
