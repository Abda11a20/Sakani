// apps/backend/src/auth/dto/reset-password.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email!: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  otp!: string;

  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  newPassword!: string;

  @IsNotEmpty({ message: 'تأكيد كلمة المرور مطلوب' })
  @IsString()
  confirmPassword!: string;
}
