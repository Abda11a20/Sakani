// apps/backend/src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GenerateLinkCodeDto } from './dto/generate-link-code.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/register ────────────────────────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 900000 } }) // 20 per 15 mins
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.register(dto);
    return { success: true, ...result };
  }

  // ── POST /auth/telegram/generate-link-code ─────────────────────────────────
  @Post('telegram/generate-link-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  async generateTelegramLinkCode(
    @Body() dto: GenerateLinkCodeDto,
  ): Promise<{
    success: boolean;
    data: { linkCode: string; expiresAt: Date };
  }> {
    const result = await this.authService.generateTelegramLinkCode(
      dto.identifier,
    );
    return { success: true, data: result };
  }

  // ── GET /auth/telegram/link-status/:code ───────────────────────────────────
  @Get('telegram/link-status/:code')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async checkTelegramLinkStatus(
    @Param('code') code: string,
  ): Promise<{ success: boolean; data: { linked: boolean } }> {
    const result = await this.authService.checkTelegramLinkStatus(code);
    return { success: true, data: result };
  }

  // ── POST /auth/verify-email ────────────────────────────────────────────────
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 600000 } }) // 20 per 10 mins
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.verifyEmail(dto);
    return { success: true, ...result };
  }

  // ── POST /auth/resend-verification ──────────────────────────────────────────
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 per 5 mins
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.resendVerification(dto);
    return { success: true, ...result };
  }

  // ── POST /auth/login ───────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per 1 min
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: { accessToken: string; refreshToken: string; user: SafeUser };
  }> {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: result,
    };
  }

  // ── POST /auth/refresh ─────────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ success: boolean; data: { accessToken: string } }> {
    const result = await this.authService.refresh(refreshToken);
    return { success: true, data: result };
  }

  // ── POST /auth/logout ──────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.logout(refreshToken);
    return { success: true, ...result };
  }

  // ── GET /auth/me ───────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(
    @CurrentUser() user: SafeUser,
  ): Promise<{ success: boolean; data: { user: SafeUser } }> {
    const freshUser = await this.authService.getMe(user.id);
    return { success: true, data: { user: freshUser } };
  }

  // ── POST /auth/forgot-password ─────────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 per 15 mins
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.forgotPassword(dto);
    return { success: true, ...result };
  }

  // ── POST /auth/verify-reset-otp ────────────────────────────────────────────
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 per 10 mins
  async verifyResetOtp(
    @Body() dto: VerifyOtpDto,
  ): Promise<{ success: boolean; data: { valid: boolean } }> {
    const result = await this.authService.verifyResetOtp(dto);
    return { success: true, data: result };
  }

  // ── POST /auth/reset-password ──────────────────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.resetPassword(dto);
    return { success: true, ...result };
  }

  // ── PATCH /auth/change-password ────────────────────────────────────────────
  @ApiBearerAuth()
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: SafeUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.authService.changePassword(user.id, dto);
    return { success: true, ...result };
  }
}
