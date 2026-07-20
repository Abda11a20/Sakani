// apps/backend/src/requests/dto/quick-rent.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class QuickRentDto {
  @IsNotEmpty()
  @IsString()
  listingId: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsDateString()
  rentedSince: string;

  @IsNotEmpty()
  @IsDateString()
  rentedUntil: string;

  @IsOptional()
  @IsString()
  bedId?: string;
}
