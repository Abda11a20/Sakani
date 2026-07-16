// apps/backend/src/rental-contracts/dto/create-contract.dto.ts

import { IsNotEmpty, IsString, IsEnum, IsDate, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentCycle, ContractCreatedBy } from '@prisma/client';

export class CreateContractDto {
  @IsString({ message: 'listingId must be a string' })
  @IsNotEmpty({ message: 'listingId is required' })
  listingId!: string;

  @IsString({ message: 'landlordId must be a string' })
  @IsNotEmpty({ message: 'landlordId is required' })
  landlordId!: string;

  @IsString({ message: 'tenantId must be a string' })
  @IsNotEmpty({ message: 'tenantId is required' })
  tenantId!: string;

  @IsString({ message: 'bedId must be a string' })
  @IsOptional()
  bedId?: string;

  @IsString({ message: 'viewingRequestId must be a string' })
  @IsOptional()
  viewingRequestId?: string;

  @IsEnum(ContractCreatedBy, { message: 'createdByType must be a valid ContractCreatedBy value' })
  @IsOptional()
  createdByType?: ContractCreatedBy;

  @IsInt({ message: 'monthlyRent must be an integer' })
  @IsNotEmpty({ message: 'monthlyRent is required' })
  monthlyRent!: number;

  @IsInt({ message: 'securityDeposit must be an integer' })
  @IsOptional()
  securityDeposit?: number;

  @IsEnum(PaymentCycle, { message: 'paymentCycle must be a valid PaymentCycle' })
  @IsOptional()
  paymentCycle?: PaymentCycle;

  @IsString({ message: 'currency must be a string' })
  @IsOptional()
  currency?: string;

  @IsDate({ message: 'startDate must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'startDate is required' })
  startDate!: Date;

  @IsDate({ message: 'endDate must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'endDate is required' })
  endDate!: Date;

  @IsBoolean({ message: 'isAutoRenew must be a boolean' })
  @IsOptional()
  isAutoRenew?: boolean;

  @IsString({ message: 'notes must be a string' })
  @IsOptional()
  notes?: string;
}
