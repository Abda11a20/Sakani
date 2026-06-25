// apps/backend/src/auth/auth.service.ts
// Service for authentication and authorization

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole, VerificationType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

type SafeUser = Omit<User, 'passwordHash'>;

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// ── AES-256-CBC Encryption Helpers ────────────────────────────────────────────
function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? '';
  if (!raw) throw new Error('ENCRYPTION_KEY غير موجود في متغيرات البيئة');
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32), 'utf8');
}

function encryptAES(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptAES(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, dataHex] = encryptedText.split(':');
  if (!ivHex || !dataHex) throw new Error('صيغة النص المشفر غير صحيحة');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

function hashNationalId(nationalId: string): string {
  return crypto.createHash('sha256').update(nationalId).digest('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ── AuthService ────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ── User Registration ──────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ message: string }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيدها غير متطابقين');
    }

    // التحقق من عدم تكرار الهاتف أو الإيميل
    const [existingPhone, existingEmail] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone: dto.phone } }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
    ]);

    if (existingPhone) throw new ConflictException('رقم الموبايل مسجل مسبقاً');
    if (existingEmail) throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');

    // التحقق من عدم تكرار الرقم القومي
    const nationalIdHash = hashNationalId(dto.nationalId);
    const existingNationalId = await this.prisma.user.findFirst({
      where: { nationalIdEnc: { startsWith: nationalIdHash } },
    });
    if (existingNationalId) throw new ConflictException('الرقم القومي مسجل مسبقاً');

    // تشفير البيانات الحساسة
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const nationalIdEncrypted = encryptAES(dto.nationalId);
    const nationalIdEnc = `${nationalIdHash}:${nationalIdEncrypted}`;

    const role: UserRole =
      dto.role === 'landlord' ? UserRole.landlord : UserRole.tenant;

    // إنشاء المستخدم وإرسال كود التفعيل داخل Transaction لضمان التراجع في حالة حدوث خطأ
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          nationalIdEnc,
          role,
          emailVerifiedAt: null, // يُفعَّل عند التحقق
        },
      });

      // إرسال OTP للتحقق من الإيميل داخل الـ Transaction
      await this.sendVerificationCodeTx(tx, user.id, dto.email, VerificationType.EMAIL_VERIFICATION);
    });

    return { message: 'تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.' };
  }

  // ── Verify Email ───────────────────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.consumeVerificationCode(dto.email, dto.otp, VerificationType.EMAIL_VERIFICATION);

    // تفعيل الحساب بتعيين emailVerifiedAt
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerifiedAt: new Date() },
    });

    return { message: 'تم تفعيل الحساب بنجاح. يمكنك تسجيل الدخول الآن.' };
  }

  // ── User Login ─────────────────────────────────────────────────────────────
  async login(
    dto: LoginDto,
    ip?: string,
    deviceName?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    // البحث بالإيميل أو الهاتف
    const user = await this.findUserByIdentifier(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('هذا الحساب محظور. تواصل مع الدعم الفني');
    }

    // التحقق من تفعيل الإيميل
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'الحساب لم يتم تفعيله بعد. يرجى فتح الإيميل وإدخال رمز التفعيل.',
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException('هذا الحساب لا يدعم تسجيل الدخول بكلمة مرور');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const { passwordHash: _ph, ...safeUser } = user;
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = await this.createDeviceSession(user.id, ip, deviceName);

    return { accessToken, refreshToken, user: safeUser };
  }

  // ── Refresh Token ──────────────────────────────────────────────────────────
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = hashToken(refreshToken);

    const session = await this.prisma.deviceSession.findFirst({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('جلسة غير صالحة أو منتهية. يرجى تسجيل الدخول مجدداً.');
    }

    // تحديث وقت آخر نشاط
    await this.prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastSeen: new Date() },
    });

    const { passwordHash: _ph, ...safeUser } = session.user;
    const accessToken = this.generateAccessToken(safeUser);

    return { accessToken };
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.deviceSession.deleteMany({
      where: { refreshTokenHash: tokenHash },
    });
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  // ── Passport Validation ────────────────────────────────────────────────────
  async validateUser(identifier: string, password: string): Promise<SafeUser | null> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user || !user.passwordHash || !user.isActive) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  // ── Forgot Password ────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // نرجع نفس الرسالة سواء كان الإيميل موجوداً أم لا (أمان ضد الـ User Enumeration)
    if (!user) {
      return { message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة بالكود.' };
    }

    await this.sendVerificationCode(user.id, dto.email, VerificationType.PASSWORD_RESET);

    return { message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة بالكود.' };
  }

  // ── Verify Reset OTP ───────────────────────────────────────────────────────
  async verifyResetOtp(dto: VerifyOtpDto): Promise<{ valid: boolean }> {
    await this.verifyCode(dto.email, dto.otp, VerificationType.PASSWORD_RESET);
    return { valid: true };
  }

  // ── Reset Password ─────────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيدها غير متطابقين');
    }

    // التحقق من الكود واستهلاكه
    await this.consumeVerificationCode(dto.email, dto.otp, VerificationType.PASSWORD_RESET);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    // تغيير كلمة المرور + إلغاء كل الجلسات الحالية (أمان)
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: dto.email },
        data: { passwordHash },
      }),
      this.prisma.deviceSession.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  // ── Change Password (Authenticated) ───────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيدها غير متطابقين');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    // تغيير كلمة المرور + إلغاء كل الجلسات (تسجيل خروج من كل الأجهزة)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.deviceSession.deleteMany({ where: { userId } }),
    ]);

    return { message: 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.' };
  }

  // ── Get Current User ───────────────────────────────────────────────────────
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private generateAccessToken(user: SafeUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async createDeviceSession(
    userId: string,
    ip?: string,
    deviceName?: string,
  ): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.deviceSession.create({
      data: {
        userId,
        refreshTokenHash,
        ip: ip ?? null,
        deviceName: deviceName ?? null,
      },
    });

    return refreshToken;
  }

  private async sendVerificationCode(
    userId: string,
    email: string,
    type: VerificationType,
  ): Promise<void> {
    // حذف أي كودات قديمة من نفس النوع لنفس المستخدم
    await this.prisma.verificationCode.deleteMany({
      where: { userId, type },
    });

    const otp = generateOtp();
    const codeHash = hashToken(otp); // نحفظ الـ Hash فقط (أمان)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.verificationCode.create({
      data: { userId, email, type, codeHash, expiresAt },
    });

    // إرسال الكود بالإيميل
    if (type === VerificationType.EMAIL_VERIFICATION) {
      await this.emailService.sendEmailVerification(email, otp);
    } else if (type === VerificationType.PASSWORD_RESET) {
      await this.emailService.sendPasswordReset(email, otp);
    }
  }

  private async sendVerificationCodeTx(
    tx: Prisma.TransactionClient,
    userId: string,
    email: string,
    type: VerificationType,
  ): Promise<void> {
    // حذف أي كودات قديمة من نفس النوع لنفس المستخدم
    await tx.verificationCode.deleteMany({
      where: { userId, type },
    });

    const otp = generateOtp();
    const codeHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await tx.verificationCode.create({
      data: { userId, email, type, codeHash, expiresAt },
    });

    // إرسال الكود بالإيميل
    if (type === VerificationType.EMAIL_VERIFICATION) {
      await this.emailService.sendEmailVerification(email, otp);
    } else if (type === VerificationType.PASSWORD_RESET) {
      await this.emailService.sendPasswordReset(email, otp);
    }
  }

  private async verifyCode(
    email: string,
    otp: string,
    type: VerificationType,
  ): Promise<{ id: string }> {
    const record = await this.prisma.verificationCode.findFirst({
      where: { email, type, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('لا يوجد رمز تحقق نشط لهذا البريد الإلكتروني');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('تجاوزت الحد الأقصى للمحاولات. يرجى طلب رمز جديد.');
    }

    const inputHash = hashToken(otp);
    const isValid = record.codeHash === inputHash;

    if (!isValid) {
      // زيادة عداد المحاولات
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    return { id: record.id };
  }

  private async consumeVerificationCode(
    email: string,
    otp: string,
    type: VerificationType,
  ): Promise<void> {
    const { id } = await this.verifyCode(email, otp, type);

    // تعليم الكود كـ "مستخدم" حتى لا يُستخدم مرة ثانية
    await this.prisma.verificationCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  private async findUserByIdentifier(identifier: string) {
    if (isEmail(identifier)) {
      return this.prisma.user.findUnique({ where: { email: identifier } });
    }
    return this.prisma.user.findUnique({ where: { phone: identifier } });
  }
}
