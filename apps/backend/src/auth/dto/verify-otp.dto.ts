// apps/backend/src/auth/dto/verify-otp.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  otp!: string;
}
