import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import {
  AdStatus,
  TargetUserRole,
  DeviceTarget,
  PaymentMethod,
} from '@prisma/client';
import { AdCategory } from './ad-query.dto';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  campaignCode: string; // e.g. "CMP-2026-001"

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsOptional()
  clientLogo?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(AdStatus)
  @IsOptional()
  status?: AdStatus;

  @IsEnum(AdCategory)
  @IsOptional()
  category?: AdCategory;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsEnum(TargetUserRole)
  @IsOptional()
  targetUserRole?: TargetUserRole;

  @IsEnum(DeviceTarget)
  @IsOptional()
  targetDevice?: DeviceTarget;

  @IsString()
  @IsOptional()
  targetCountry?: string;
}
