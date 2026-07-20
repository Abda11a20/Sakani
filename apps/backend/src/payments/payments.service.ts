// apps/backend/src/payments/payments.service.ts

import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UserPlan } from '@prisma/client';
import * as crypto from 'crypto';
// Removed rxjs import

// ── Paymob API response shapes ────────────────────────────────────────────────
interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

// ── Mock subscription shape (when subscriptions disabled) ─────────────────────
export interface MockPlanResult {
  plan: 'premium';
  status: 'active';
  mock: true;
}

export interface FreePlanResult {
  plan: 'free';
  status: 'inactive';
}

// ── Paymob webhook payload shape ──────────────────────────────────────────────
interface PaymobWebhookObj {
  success?: boolean;
  order?: { merchant_order_id?: string };
  amount_cents?: number;
  source_data?: { pan?: string };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // ── Helper ─────────────────────────────────────────────────────────────────
  isSubscriptionsEnabled(): boolean {
    return this.configService.get<string>('SUBSCRIPTIONS_ENABLED') === 'true';
  }

  // ── 1. Get current plan ───────────────────────────────────────────────────
  async getCurrentPlan(userId: string): Promise<Record<string, unknown>> {
    if (!this.isSubscriptionsEnabled()) {
      return {
        plan: 'premium',
        status: 'active',
        mock: true,
      } satisfies MockPlanResult;
    }

    const now = new Date();

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return { plan: 'free', status: 'inactive' } satisfies FreePlanResult;
    }

    return subscription;
  }

  // ── 2. Initiate Payment ───────────────────────────────────────────────────
  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    if (!this.isSubscriptionsEnabled()) {
      throw new BadRequestException(
        'الاشتراكات غير مفعّلة حالياً — الخدمة مجانية',
      );
    }

    const apiKey = this.configService.get<string>('PAYMOB_API_KEY');
    const integrationId = this.configService.get<string>(
      'PAYMOB_INTEGRATION_ID',
    );
    const iframeId =
      this.configService.get<string>('PAYMOB_IFRAME_ID') ?? '123456';

    const amountCents = dto.plan === UserPlan.premium ? 5000 : 0;
    const merchantOrderId = `SAKANI-${userId}-${Date.now()}`;

    // Step 1: Create order
    const orderRes = await this.httpService.axiosRef.post<PaymobOrderResponse>(
      'https://accept.paymob.com/api/ecommerce/orders',
      {
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
      },
      {
        headers: { Authorization: `Token ${apiKey}` },
      },
    );

    const orderId = orderRes.data.id;

    // Step 2: Get payment key
    const keyRes =
      await this.httpService.axiosRef.post<PaymobPaymentKeyResponse>(
        'https://accept.paymob.com/api/acceptance/payment_keys',
        {
          auth_token: apiKey,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: orderId,
          billing_data: {
            first_name: dto.billingName,
            phone_number: dto.billingPhone,
            email: 'NA',
            last_name: 'NA',
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            city: 'Cairo',
            country: 'EG',
            postal_code: 'NA',
            state: 'NA',
          },
          integration_id: integrationId,
        },
        {
          headers: { Authorization: `Token ${apiKey}` },
        },
      );

    const paymentToken = keyRes.data.token;
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;

    return { paymentUrl };
  }

  // ── 3. Handle Webhook ─────────────────────────────────────────────────────
  async handleWebhook(
    payload: Record<string, unknown>,
    hmacHeader: string,
  ): Promise<{ received: boolean }> {
    // Always verify HMAC first — never trust unverified Paymob payloads
    const isValid = this.verifyHmac(payload, hmacHeader);
    if (!isValid) {
      throw new UnauthorizedException('HMAC signature غير صالح');
    }

    try {
      const obj = payload['obj'] as PaymobWebhookObj | undefined;

      if (!obj?.success) {
        this.logger.log('Webhook received: payment not successful, skipping.');
        return { received: true };
      }

      // Extract userId from merchant_order_id (format: SAKANI-{userId}-{timestamp})
      const merchantOrderId = obj?.order?.merchant_order_id ?? '';
      const parts = merchantOrderId.split('-');
      // parts: ['SAKANI', userId, timestamp]
      if (parts.length < 3) {
        this.logger.warn(`Unexpected merchant_order_id: ${merchantOrderId}`);
        return { received: true };
      }
      const userId = parts[1];

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      // Create subscription record
      await this.prisma.subscription.create({
        data: {
          userId,
          plan: UserPlan.premium,
          status: 'active',
          startedAt: now,
          expiresAt,
          paymobRef: merchantOrderId,
        },
      });

      // Upgrade user plan
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: UserPlan.premium,
          planExpiresAt: expiresAt,
        },
      });

      this.logger.log(
        `Subscription activated for user ${userId} until ${expiresAt.toISOString()}`,
      );
    } catch (err) {
      // Log but never throw — Paymob will retry if we throw 5xx
      this.logger.error('Error processing webhook', err);
    }

    return { received: true };
  }

  // ── 4. Verify HMAC ────────────────────────────────────────────────────────
  verifyHmac(payload: Record<string, unknown>, hmacHeader: string): boolean {
    const secret = this.configService.get<string>('PAYMOB_HMAC_SECRET') ?? '';

    const hmacSecret = secret;
    const payloadString = JSON.stringify(payload);

    const computed = crypto
      .createHmac('sha512', hmacSecret)
      .update(payloadString)
      .digest('hex');

    return computed === hmacHeader;
  }

  // ── 5. Get subscription history ───────────────────────────────────────────
  async getSubscriptionHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 6. Cancel subscription ────────────────────────────────────────────────
  async cancelSubscription(userId: string) {
    const now = new Date();

    const active = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: now },
      },
    });

    if (active) {
      await this.prisma.subscription.update({
        where: { id: active.id },
        data: { status: 'cancelled' },
      });
    }

    // Downgrade user plan
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: UserPlan.free,
        planExpiresAt: null,
      },
    });

    return { success: true, message: 'تم إلغاء الاشتراك بنجاح' };
  }

  // ── 7. Cron: Check expired subscriptions (daily at 02:00) ─────────────────
  @Cron('0 2 * * *')
  async checkExpiredSubscriptions(): Promise<void> {
    if (!this.isSubscriptionsEnabled()) {
      return;
    }

    const now = new Date();
    this.logger.log('[Cron] Checking expired subscriptions...');

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: now },
      },
      select: { id: true, userId: true },
    });

    if (expired.length === 0) {
      this.logger.log('[Cron] No expired subscriptions found.');
      return;
    }

    const expiredIds = expired.map((s) => s.id);
    const expiredUserIds = expired.map((s) => s.userId);

    // Mark subscriptions as expired
    await this.prisma.subscription.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'expired' },
    });

    // Downgrade affected users to free plan
    await this.prisma.user.updateMany({
      where: { id: { in: expiredUserIds } },
      data: {
        plan: UserPlan.free,
        planExpiresAt: null,
      },
    });

    this.logger.log(
      `[Cron] Expired ${expired.length} subscription(s) and downgraded ${expiredUserIds.length} user(s) to free plan.`,
    );
  }
}
