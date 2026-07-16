// apps/backend/src/community/dto/create-post.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { GenderPreference } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

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
  genderPreference: GenderPreference;

  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants: number;

  @IsDateString()
  eventDate: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;
}
