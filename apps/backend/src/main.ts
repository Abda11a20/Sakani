// apps/backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ── 1. إعدادات السيرفر الأساسية (Server Configs) ─────────────
  
  // تفعيل النسخ (API Versioning)
  app.setGlobalPrefix('api/v1');

  // إغلاق الاتصالات بسلام (Graceful Shutdown)
  app.enableShutdownHooks();

  // الثقة بالـ Proxy إذا كنا خلف Nginx أو خدمات سحابية
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // ── 2. الأمان (Security) ──────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production';

  // Helmet ديناميكي (إلغاء الـ CSP في التطوير فقط لعدم تعطيل الـ Swagger/Next)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: isProduction ? undefined : false,
    })
  );

  // ضغط الاستجابة (Compression)
  app.use(compression());

  // CORS ديناميكي (السماح لـ Localhost في التطوير، والدومينات المحددة في الإنتاج)
  const allowedOrigins = isProduction 
    ? [process.env.FRONTEND_URL || 'https://sakany.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // ── 3. Global Validation Pipe ─────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // يحذف الحقول غير المعلنة في DTO
      forbidNonWhitelisted: true, // يرفع error لو في حقل زيادة
      transform: true,           // يحوّل types تلقائياً
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── 4. Swagger Documentation ──────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Sakani API')
    .setDescription('The Sakani Enterprise API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── 5. Global Exception Filter ─────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── 6. تشغيل السيرفر ─────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Sakani Backend is running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
