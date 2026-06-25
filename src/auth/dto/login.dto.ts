// apps/backend/src/auth/dto/login.dto.ts

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * يقبل الحقل رقم الهاتف المصري أو البريد الإلكتروني
   * التحقق من الصيغة يتم في الـ Service بعد تحديد النوع
   */
  @IsNotEmpty({ message: 'رقم الهاتف أو البريد الإلكتروني مطلوب' })
  @IsString()
  identifier!: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password!: string;
}
