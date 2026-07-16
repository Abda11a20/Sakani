import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['EMAIL', 'TELEGRAM'])
  channel?: 'EMAIL' | 'TELEGRAM';
}
