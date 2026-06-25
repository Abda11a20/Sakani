// apps/backend/src/listings/dto/create-listing.dto.ts

import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { UnitType, ElectricityType, GenderTarget } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty({ message: 'العنوان مطلوب' })
  @MinLength(10, { message: 'العنوان يجب أن يكون 10 أحرف على الأقل' })
  @MaxLength(100, { message: 'العنوان يجب أن لا يتجاوز 100 حرف' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(UnitType, { message: 'نوع الوحدة غير صحيح' })
  @IsNotEmpty({ message: 'نوع الوحدة مطلوب' })
  unitType!: UnitType;

  @IsNumber()
  @Min(1, { message: 'السعر يجب أن يكون أكبر من 0' })
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'مبلغ التأمين لا يمكن أن يكون سالباً' })
  @Type(() => Number)
  securityDeposit?: number;

  @IsOptional()
  @IsBoolean()
  includesBills?: boolean;

  @IsOptional()
  @IsEnum(ElectricityType, { message: 'نوع عداد الكهرباء غير صحيح' })
  electricityType?: ElectricityType;

  // إجباري فقط لو نوع الوحدة 'bed'
  @ValidateIf((o: CreateListingDto) => o.unitType === UnitType.bed)
  @IsNotEmpty({ message: 'عدد الأسرة مطلوب لأن الوحدة سرير' })
  @IsNumber()
  @Min(1, { message: 'عدد الأسرة يجب أن يكون 1 على الأقل' })
  @Type(() => Number)
  totalBeds?: number;

  @IsOptional()
  @IsEnum(GenderTarget, { message: 'نوع الجنس المستهدف غير صحيح' })
  genderTarget?: GenderTarget;

  @IsString()
  @IsNotEmpty({ message: 'المحافظة مطلوبة' })
  governorate!: string;

  @IsString()
  @IsNotEmpty({ message: 'المنطقة مطلوبة' })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: 'العنوان التفصيلي مطلوب' })
  address!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsBoolean()
  roommateFeatureEnabled?: boolean;
}
