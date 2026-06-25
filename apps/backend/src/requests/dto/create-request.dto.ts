// apps/backend/src/requests/dto/create-request.dto.ts

import { IsString, IsNotEmpty, IsOptional, MaxLength, IsDate, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'معرف الإعلان (listingId) مطلوب' })
  listingId!: string;

  @IsDate({ message: 'التاريخ المفضل يجب أن يكون تاريخاً صحيحاً' })
  @Type(() => Date)
  @MinDate(new Date(), { message: 'التاريخ المفضل يجب أن يكون في المستقبل' })
  @IsNotEmpty({ message: 'التاريخ المفضل مطلوب' })
  preferredDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'الرسالة يجب أن لا تتجاوز 500 حرف' })
  message?: string;

  @IsOptional()
  @IsString()
  specialty?: string;
}
