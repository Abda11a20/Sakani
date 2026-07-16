import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ResendVerificationDto {
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
