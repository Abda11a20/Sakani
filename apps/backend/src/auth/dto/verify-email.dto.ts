import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsOptional()
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
