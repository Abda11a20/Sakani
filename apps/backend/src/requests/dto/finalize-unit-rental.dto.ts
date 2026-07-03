import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FinalizeUnitRentalDto {
  @IsDate({ message: 'rentedSince must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'rentedSince is required' })
  rentedSince!: Date;

  @IsDate({ message: 'rentedUntil must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'rentedUntil is required' })
  rentedUntil!: Date;
}
