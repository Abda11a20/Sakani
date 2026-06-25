// apps/backend/src/users/dto/update-profile.dto.ts

import { IsOptional, IsString, MaxLength, MinLength, Matches, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'الاسم لازم يكون على الأقل حرفين' })
  @MaxLength(100, { message: 'الاسم لازم يكون أقل من 100 حرف' })
  @Matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, {
    message: 'الاسم لازم يحتوي على حروف فقط (عربي أو إنجليزي) بدون أرقام أو رموز',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'رابط الصورة غير صحيح' })
  avatarUrl?: string;
}
