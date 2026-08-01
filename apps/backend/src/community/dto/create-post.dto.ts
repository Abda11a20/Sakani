// apps/backend/src/community/dto/create-post.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
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

  @IsInt({ message: 'الحد الأقصى للمشاركين يجب أن يكون رقماً صحيحاً' })
  @Min(2, { message: 'الحد الأقصى للمشاركين يجب أن يكون شخصين على الأقل (2 أو أكثر)' })
  @Max(100, { message: 'الحد الأقصى للمشاركين لا يمكن أن يتجاوز 100 شخص' })
  maxParticipants: number;

  @IsDateString()
  eventDate: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;
}
