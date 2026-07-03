// apps/backend/src/requests/dto/finalize-bed-rental.dto.ts

import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class FinalizeBedRentalDto {
  @IsString()
  @IsNotEmpty({ message: 'bedId is required' })
  bedId!: string;

  @IsDate({ message: 'rentedSince must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'rentedSince is required' })
  rentedSince!: Date;

  @IsDate({ message: 'rentedUntil must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'rentedUntil is required' })
  rentedUntil!: Date;
}
