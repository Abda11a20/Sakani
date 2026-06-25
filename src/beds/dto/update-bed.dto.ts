// apps/backend/src/beds/dto/update-bed.dto.ts

import { IsOptional, IsEnum } from 'class-validator';
import { BedType } from '@prisma/client';

export class UpdateBedDto {
  @IsOptional()
  @IsEnum(BedType, { message: 'نوع السرير يجب أن يكون single أو double' })
  bedType?: BedType;
}
