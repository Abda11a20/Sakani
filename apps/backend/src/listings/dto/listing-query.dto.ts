// apps/backend/src/listings/dto/listing-query.dto.ts

import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UnitType, GenderTarget } from '@prisma/client';

export class ListingQueryDto {
  @IsOptional()
  @IsEnum(UnitType)
  unitType?: UnitType;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(GenderTarget)
  genderTarget?: GenderTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  amenities?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  verifiedOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number = 12;
}
