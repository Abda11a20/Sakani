// apps/backend/src/app.module.ts

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { BedsModule } from './beds/beds.module';
import { RequestsModule } from './requests/requests.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { SearchModule } from './search/search.module';
import { AlertsModule } from './alerts/alerts.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { RentalHistoryModule } from './rental-history/rental-history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RentalContractsModule } from './rental-contracts/rental-contracts.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    LoggerModule,
    // إعداد متغيرات البيئة — متاحة في كل التطبيق
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    // Throttler (Rate Limiting) Global
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute globally
      },
    ]),
    // Prisma — Global Module يتاح في كل مكان
    PrismaModule,
    // Auth Module
    AuthModule,
    // Users Module
    UsersModule,
    // Listings Module
    ListingsModule,
    // Beds Module
    BedsModule,
    // Requests Module
    RequestsModule,
    // Admin Module
    AdminModule,
    // Reviews Module
    ReviewsModule,
    // Uploads Module
    UploadsModule,
    // Search Module
    SearchModule,
    // Alerts Module
    AlertsModule,
    // Payments Module
    PaymentsModule,
    // Schedule support (also registered in PaymentsModule, idempotent)
    ScheduleModule.forRoot(),
    // Notifications Module
    NotificationsModule,
    ChatModule,
    HealthModule,
    RentalHistoryModule,
    DashboardModule,
    RentalContractsModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggerMiddleware).forRoutes('*');
  }
}
