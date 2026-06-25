// apps/backend/src/admin/dto/ban-user.dto.ts

import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class BanUserDto {
  @IsOptional()
  @IsString()
  nationalIdHash?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'سبب الحظر مطلوب' })
  reason!: string;
}
