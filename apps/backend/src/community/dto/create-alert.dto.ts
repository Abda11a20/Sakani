// apps/backend/src/community/dto/create-alert.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { GenderPreference } from '@prisma/client';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  governorateId: string;

  @IsString()
  @IsNotEmpty()
  cityId: string;

  @IsEnum(GenderPreference)
  @IsOptional()
  genderPreference?: GenderPreference;
}
