// apps/backend/src/auth/dto/verify-otp.dto.ts

import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email!: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  otp!: string;
}
