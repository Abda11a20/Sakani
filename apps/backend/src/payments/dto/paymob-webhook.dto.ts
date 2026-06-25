// apps/backend/src/payments/dto/paymob-webhook.dto.ts

import { IsObject } from 'class-validator';

export class PaymobWebhookDto {
  @IsObject()
  obj: Record<string, unknown>;
}
