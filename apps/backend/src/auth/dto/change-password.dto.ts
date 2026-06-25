// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\auth\dto\change-password.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
