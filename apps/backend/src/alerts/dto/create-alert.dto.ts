// apps/backend/src/alerts/dto/create-alert.dto.ts

import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType, GenderTarget } from '@prisma/client';

export class CreateAlertDto {
  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(UnitType)
  unitType?: UnitType;

  @IsOptional()
  @IsEnum(GenderTarget)
  genderTarget?: GenderTarget;

  @IsOptional()
  @IsString()
  specialty?: string;

  // Ensure at least one filter is present (validated in service)
  @ValidateIf(
    (o: CreateAlertDto) =>
      !o.governorate &&
      !o.district &&
      o.maxPrice === undefined &&
      !o.unitType &&
      !o.genderTarget &&
      !o.specialty,
  )
  @IsString({ message: 'يجب تحديد فلتر واحد على الأقل' })
  _atLeastOne?: never;
}
