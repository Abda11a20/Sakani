import { IsEmail, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ForgotPasswordDto {
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['EMAIL', 'TELEGRAM'])
  channel?: 'EMAIL' | 'TELEGRAM';
}
