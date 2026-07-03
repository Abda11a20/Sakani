// apps/backend/src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

// تحويل JWT_EXPIRES_IN من string إلى ثوانٍ
function parseExpiry(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60; // 15 دقيقة افتراضياً (Access Token قصير)
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return amount;
    case 'm': return amount * 60;
    case 'h': return amount * 3600;
    case 'd': return amount * 86400;
    default:  return 15 * 60;
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET') ?? 'fallback-secret';
        const expiresInStr = configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
        return {
          secret,
          signOptions: {
            expiresIn: parseExpiry(expiresInStr),
          },
        };
      },
      inject: [ConfigService],
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, ConfigService],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
