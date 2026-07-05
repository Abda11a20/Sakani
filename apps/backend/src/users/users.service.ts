// apps/backend/src/users/users.service.ts

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from '@prisma/client';
import { UploadsService } from '../uploads/uploads.service';
import * as bcrypt from 'bcrypt';

type SafeUser = Omit<User, 'passwordHash' | 'nationalIdEnc'>;
type PublicProfile = Pick<User, 'id' | 'name' | 'avatarUrl' | 'emailVerifiedAt' | 'role' | 'createdAt'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) { }

  // ── جلب البروفايل الخاص بالمستخدم ─────────────────────────────────────────
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const { passwordHash: _ph, nationalIdEnc: _nid, ...safeUser } = user;
    return safeUser;
  }

  // ── تحديث البروفايل ──────────────────────────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { passwordHash: _ph, nationalIdEnc: _nid, ...safeUser } = user;
    return safeUser;
  }

  // ── جلب بروفايل عام (لمستخدمين آخرين) ──────────────────────────────────
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  // ── عرض كل المستخدمين للـ Admin ─────────────────────────────────────────
  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: SafeUser[], total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const safeUsers = users.map(user => {
      const { passwordHash: _ph, nationalIdEnc: _nid, ...safeUser } = user;
      return safeUser;
    });

    return { users: safeUsers, total };
  }

  // ── تفعيل / إيقاف مستخدم (للـ Admin) ─────────────────────────────────────
  async toggleUserStatus(userId: string): Promise<{ message: string; isActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return {
      message: updatedUser.isActive ? 'Account activated successfully' : 'Account deactivated successfully',
      isActive: updatedUser.isActive,
    };
  }

  // ── Self Account Deletion (Banned users are blocked) ───────────────────────
  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Banned users are not allowed to delete their own accounts
    if (!user.isActive) {
      throw new ForbiddenException('غير مسموح للمستخدمين المحظورين بحذف الحساب');
    }

    // Cleanup assets in Cloudinary/S3 before deletion
    await this.uploadsService.deleteUserAssets(user.avatarPublicId, user.idCardPublicId);

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Account deleted successfully' };
  }

  // ── Admin: Create User Manually ───────────────────────────────────────
  async createUserByAdmin(dto: CreateUserDto): Promise<SafeUser> {
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role ?? UserRole.tenant,
        nationalIdEnc: '',
      },
    });

    const { passwordHash: _ph, nationalIdEnc: _nid, ...safeUser } = user;
    return safeUser;
  }

  // ── Admin: Delete Any User Permanently ──────────────────────────────
  async deleteUserByAdmin(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.super_admin) {
      throw new ForbiddenException('Cannot delete a super_admin account');
    }

    // Cleanup assets in Cloudinary/S3 before deletion
    await this.uploadsService.deleteUserAssets(user.avatarPublicId, user.idCardPublicId);

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'User deleted permanently' };
  }

  // ── البحث عن مستأجر برقم الهاتف ─────────────────────────────────────────
  async lookupByPhone(phone: string) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (!cleaned) {
      throw new NotFoundException('رقم الهاتف المدخل غير صالح');
    }
    
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleaned },
          { phone: cleaned.startsWith('2') ? cleaned.substring(1) : cleaned },
          { phone: cleaned.startsWith('20') ? cleaned.substring(2) : cleaned },
          { phone: cleaned.startsWith('0') ? cleaned : '0' + cleaned },
          { phone: cleaned.startsWith('20') ? '0' + cleaned.substring(2) : cleaned },
        ],
        role: UserRole.tenant,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستأجر غير مسجل بالمنصة برقم الهاتف المدخل');
    }

    return user;
  }
}
