import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ResendVerificationDto {
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
