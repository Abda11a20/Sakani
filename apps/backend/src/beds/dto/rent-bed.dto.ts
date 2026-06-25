// apps/backend/src/beds/dto/rent-bed.dto.ts

import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RentBedDto {
  @IsString()
  @IsNotEmpty({ message: 'معرف المستأجر (tenantId) مطلوب' })
  tenantId!: string;

  @IsDate({ message: 'تاريخ بداية التأجير يجب أن يكون تاريخاً صحيحاً' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'تاريخ بداية التأجير مطلوب' })
  rentedSince!: Date;

  @IsDate({ message: 'تاريخ نهاية التأجير يجب أن يكون تاريخاً صحيحاً' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'تاريخ نهاية التأجير مطلوب' })
  rentedUntil!: Date;
}
