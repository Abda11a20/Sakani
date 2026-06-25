// apps/backend/src/auth/dto/register.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsIn,
} from 'class-validator';

// القيم المقبولة للـ role في التسجيل العادي فقط
type AllowedRegisterRole = 'tenant' | 'landlord';

export class RegisterDto {
  // ── الاسم: حروف عربية أو إنجليزية أو مسافات فقط ────────
  @IsString()
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  @MinLength(2, { message: 'الاسم لازم يكون على الأقل حرفين' })
  @MaxLength(100, { message: 'الاسم لازم يكون أقل من 100 حرف' })
  @Matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, {
    message: 'الاسم لازم يحتوي على حروف فقط (عربي أو إنجليزي) بدون أرقام أو رموز',
  })
  name!: string;

  // ── البريد الإلكتروني: إجباري ────────────────────────────
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email!: string;

  // ── رقم الموبايل: 11 رقم — شبكات مصرية فعلاً ────────────
  @IsString()
  @IsNotEmpty({ message: 'رقم الموبايل مطلوب' })
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'رقم الموبايل لازم يكون رقم مصري صحيح 11 رقم (مثال: 01012345678)',
  })
  phone!: string;

  // ── الرقم القومي: 14 رقم بالظبط ─────────────────────────
  @IsString()
  @IsNotEmpty({ message: 'الرقم القومي مطلوب' })
  @Matches(/^[0-9]{14}$/, {
    message: 'الرقم القومي لازم يكون 14 رقم بالظبط',
  })
  nationalId!: string;

  // ── كلمة المرور: أي نوع — 6 خانات كحد أدنى ─────────────
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور لازم تكون على الأقل 6 خانات' })
  @MaxLength(100, { message: 'كلمة المرور طويلة جداً' })
  password!: string;

  // ── تأكيد كلمة المرور: لا يُحفظ في DB ───────────────────
  @IsString()
  @IsNotEmpty({ message: 'تأكيد كلمة المرور مطلوب' })
  confirmPassword!: string;

  // ── الدور: tenant أو landlord فقط ────────────────────────
  @IsOptional()
  @IsIn(['tenant', 'landlord'], {
    message: 'الدور المسموح بيه في التسجيل: tenant أو landlord فقط',
  })
  role?: AllowedRegisterRole;
}
