// apps/backend/src/notifications/push.controller.ts

import { Controller, Post, Delete, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PushNotificationService } from './push.service';

type SafeUser = Omit<User, 'passwordHash'>;

class SubscribeDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName?: string;
  browser?: string;
}

class UnsubscribeDto {
  endpoint: string;
}

@ApiTags('Push Notifications')
@Controller('notifications/push')
export class PushController {
  constructor(private readonly pushService: PushNotificationService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    const publicKey = this.pushService.getPublicKey();
    return { publicKey };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser() user: SafeUser,
    @Body() dto: SubscribeDto,
  ) {
    return this.pushService.subscribe(
      user.id,
      { endpoint: dto.endpoint, keys: dto.keys },
      dto.deviceName,
      dto.browser,
    );
  }

  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @Body() dto: UnsubscribeDto,
  ) {
    return this.pushService.unsubscribe(dto.endpoint);
  }

  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMySubscriptions(
    @CurrentUser() user: SafeUser,
  ) {
    return this.pushService.getSubscriptions(user.id);
  }

  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteSubscription(
    @CurrentUser() user: SafeUser,
    @Param('id') subscriptionId: string,
  ) {
    return this.pushService.deleteSubscriptionById(user.id, subscriptionId);
  }
}
