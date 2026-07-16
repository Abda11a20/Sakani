// apps/backend/src/rental-contracts/dto/renew-contract.dto.ts

import { IsNotEmpty, IsDate, IsOptional, IsInt, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractCreatedBy } from '@prisma/client';

export class RenewContractDto {
  @IsDate({ message: 'newEndDate must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'newEndDate is required' })
  newEndDate!: Date;

  @IsInt({ message: 'newMonthlyRent must be an integer' })
  @IsOptional()
  newMonthlyRent?: number;

  @IsBoolean({ message: 'isAutoRenew must be a boolean' })
  @IsOptional()
  isAutoRenew?: boolean;

  @IsString({ message: 'notes must be a string' })
  @IsOptional()
  notes?: string;

  @IsEnum(ContractCreatedBy, { message: 'createdByType must be a valid ContractCreatedBy value' })
  @IsOptional()
  createdByType?: ContractCreatedBy;
}
