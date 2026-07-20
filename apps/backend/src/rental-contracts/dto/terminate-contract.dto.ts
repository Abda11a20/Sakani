// apps/backend/src/rental-contracts/dto/terminate-contract.dto.ts

import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TerminationReason } from '@prisma/client';

export class TerminateContractDto {
  @IsEnum(TerminationReason, {
    message: 'reason must be a valid TerminationReason',
  })
  @IsNotEmpty({ message: 'Termination reason is required' })
  reason!: TerminationReason;

  @IsString({ message: 'notes must be a string' })
  @IsOptional()
  notes?: string;

  @IsDate({ message: 'checkoutDate must be a valid date' })
  @Type(() => Date)
  @IsOptional()
  checkoutDate?: Date;
}
