import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AdDisplayType,
  TargetType,
  OpenMode,
  DayOfWeek,
  PerUserFrequencyCap,
  AdStatus,
  AdMediaType,
} from '@prisma/client';
import { AdCategory } from './ad-query.dto';

export class AdTargetDto {
  @IsEnum(TargetType)
  type: TargetType;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  internalRoute?: string;

  @IsString()
  @IsOptional()
  appDeepLink?: string;
}

export class AdMediaItemDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsEnum(AdMediaType)
  @IsOptional()
  type?: AdMediaType;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  placementKey: string; // Key of AdPlacementConfig (e.g. "HOME_HERO")

  @ValidateNested()
  @Type(() => AdTargetDto)
  target: AdTargetDto;

  @IsEnum(OpenMode)
  @IsOptional()
  openMode?: OpenMode;

  @IsEnum(AdDisplayType)
  @IsOptional()
  displayType?: AdDisplayType;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @IsOptional()
  daysOfWeek?: DayOfWeek[];

  @IsNumber()
  @IsOptional()
  dailyStartMinutes?: number; // e.g. 540 for 09:00 AM

  @IsNumber()
  @IsOptional()
  dailyEndMinutes?: number; // e.g. 1080 for 06:00 PM

  @IsNumber()
  @IsOptional()
  maxViews?: number;

  @IsNumber()
  @IsOptional()
  maxClicks?: number;

  @IsEnum(PerUserFrequencyCap)
  @IsOptional()
  perUserFrequency?: PerUserFrequencyCap;

  @IsNumber()
  @IsOptional()
  maxDisplayPerSession?: number;

  @IsBoolean()
  @IsOptional()
  isSkippable?: boolean;

  @IsBoolean()
  @IsOptional()
  isClosable?: boolean;

  @IsNumber()
  @IsOptional()
  skipSeconds?: number;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsNumber()
  @IsOptional()
  trafficWeight?: number;

  @IsEnum(AdCategory)
  @IsOptional()
  category?: AdCategory;

  @IsEnum(AdStatus)
  @IsOptional()
  status?: AdStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdMediaItemDto)
  mediaItems: AdMediaItemDto[];
}
