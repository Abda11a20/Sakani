import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetUserRole, DeviceTarget } from '@prisma/client';

export enum AdCategory {
  REAL_ESTATE = 'REAL_ESTATE',
  FURNITURE = 'FURNITURE',
  RESTAURANTS = 'RESTAURANTS',
  BANKS = 'BANKS',
  SERVICES = 'SERVICES',
  MEDICAL = 'MEDICAL',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

export class GetActiveAdQueryDto {
  @IsString()
  placementKey: string; // e.g. "HOME_HERO"

  @IsEnum(AdCategory)
  @IsOptional()
  category?: AdCategory;

  @IsEnum(TargetUserRole)
  @IsOptional()
  userRole?: TargetUserRole;

  @IsEnum(DeviceTarget)
  @IsOptional()
  deviceTarget?: DeviceTarget;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  clientMinutes?: number; // Minutes from midnight (e.g. 540 for 9am)
}
