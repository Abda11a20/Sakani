// apps/backend/src/payments/dto/initiate-payment.dto.ts

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserPlan } from '@prisma/client';

export class InitiatePaymentDto {
  @IsNotEmpty()
  @IsEnum(UserPlan)
  plan: UserPlan;

  @IsNotEmpty()
  @IsString()
  billingPhone: string;

  @IsNotEmpty()
  @IsString()
  billingName: string;
}
