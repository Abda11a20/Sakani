// apps/backend/src/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {
  User,
  UserRole,
  ListingStatus,
  ContractStatus,
  RequestStatus,
  AccountDeletionStatus,
  OtpChannel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountDeletionStatus') THEN
            CREATE TYPE "AccountDeletionStatus" AS ENUM ('IN_GRACE_PERIOD', 'RESTORED', 'PURGED', 'CANCELLED');
          END IF;
        END $$;

        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scheduledFinalDeleteAt" TIMESTAMP(3);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionStatus" "AccountDeletionStatus";
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
      `);
    } catch (err: any) {
      console.warn('[UsersService] Lifecycle DDL notice:', err?.message || err);
    }

    // Auto-process expired grace period accounts on startup safely
    this.processExpiredAccountDeletions().catch(() => {});
  }

  // ── Auto Cleanup Routine for Expired Grace Period Accounts ───────────────────
  async processExpiredAccountDeletions(): Promise<number> {
    try {
      const expiredUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: true,
          deletionStatus: AccountDeletionStatus.IN_GRACE_PERIOD,
          scheduledFinalDeleteAt: { lte: new Date() },
        },
        select: { id: true },
      });

      for (const usr of expiredUsers) {
        await this.anonymizeUser(usr.id);
      }
      return expiredUsers.length;
    } catch (err: any) {
      console.warn(
        '[processExpiredAccountDeletions] Error:',
        err?.message || err,
      );
      return 0;
    }
  }

  // ── 1. Get Current User Profile ───────────────────────────────────────────
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  // ── 2. Update Current User Profile ─────────────────────────────────────────
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });

    const { passwordHash: _ph, ...safeUser } = updatedUser;
    return safeUser;
  }

  // ── 2.5. Update OTP Channel ───────────────────────────────────────────────
  async setOtpChannel(
    userId: string,
    channel: OtpChannel,
  ): Promise<{ message: string; channel: OtpChannel }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { otpChannel: channel },
    });

    return {
      message: 'OTP Channel updated successfully',
      channel: updated.otpChannel,
    };
  }

  // ── 3. List All Users (Admin) ──────────────────────────────────────────────
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: SafeUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const safeUsers = users.map((user) => {
      const { passwordHash: _ph, ...safeUser } = user;
      return safeUser;
    });

    return { users: safeUsers, total };
  }

  // ── 4. Toggle User Status (Admin) ──────────────────────────────────────────
  async toggleUserStatus(
    userId: string,
  ): Promise<{ message: string; isActive: boolean }> {
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
      message: updatedUser.isActive
        ? 'Account activated successfully'
        : 'Account deactivated successfully',
      isActive: updatedUser.isActive,
    };
  }

  // ── 5. Enterprise Self Account Deletion (Grace Period & Guards) ────────────
  async deleteAccount(
    userId: string,
    reason?: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // 1. Admin Guard: 403 Forbidden
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      throw new ForbiddenException(
        'لا يمكن حذف حسابات الإدارة من خلال التطبيق. يرجى مراجعة إدارة النظام.',
      );
    }

    // 2. Active Commitments Guard: 409 Conflict (Using lowercase enum strings)
    const [activeListingsCount, activeContractsCount, pendingRequestsCount] =
      await Promise.all([
        this.prisma.listing.count({
          where: {
            landlordId: userId,
            status: { in: [ListingStatus.active, ListingStatus.rented] },
          },
        }),
        this.prisma.rentalContract.count({
          where: {
            OR: [{ landlordId: userId }, { tenantId: userId }],
            status: ContractStatus.active,
          },
        }),
        this.prisma.viewingRequest.count({
          where: {
            OR: [{ tenantId: userId }, { listing: { landlordId: userId } }],
            status: RequestStatus.pending,
          },
        }),
      ]);

    if (
      activeListingsCount > 0 ||
      activeContractsCount > 0 ||
      pendingRequestsCount > 0
    ) {
      throw new ConflictException(
        'لا يمكن حذف الحساب لوجود إعلانات أو عقود أو طلبات نشطة سارية. يرجى إنهاء التزاماتك وإغلاق العقود السارية أولاً.',
      );
    }

    // Calculate Grace Days from env (default 30 days)
    const graceDays = parseInt(
      process.env.ACCOUNT_DELETION_GRACE_DAYS || '30',
      10,
    );
    const scheduledFinalDeleteAt = new Date(
      Date.now() + graceDays * 24 * 60 * 60 * 1000,
    );

    const structuredReason = JSON.stringify({
      type: 'SELF_REQUEST',
      note: reason || 'طلب المستخدم حذف حسابه بنفسه',
      requestedAt: new Date().toISOString(),
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        scheduledFinalDeleteAt,
        deletionStatus: AccountDeletionStatus.IN_GRACE_PERIOD,
        deletionReason: structuredReason,
      },
    });

    // Cleanup active push subscriptions for safety
    try {
      await this.prisma.pushSubscription.deleteMany({
        where: { userId },
      });
    } catch {
      // non-blocking
    }

    return {
      message: `تم تقديم طلب حذف الحساب بنجاح ودخل فترة السماح (${graceDays} يوماً). يمكنك التواصل مع الدعم للاستعادة قبل الانقضاء.`,
    };
  }

  // ── 6. Admin Account Restoration ──────────────────────────────────────────
  async restoreAccount(
    userId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string; user: SafeUser }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const restoreInfo = JSON.stringify({
      restoredAt: new Date().toISOString(),
      reason: reason || 'استعادة الحساب من قِبل الأدمن',
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        scheduledFinalDeleteAt: null,
        deletionStatus: AccountDeletionStatus.RESTORED,
        deletionReason: restoreInfo,
      },
    });

    const { passwordHash: _ph, ...safeUser } = updatedUser;
    return {
      success: true,
      message: 'تم استعادة الحساب وتفعيله بنجاح مرة أخرى.',
      user: safeUser,
    };
  }

  // ── 7. Soft Anonymize User (Purge Action) ────────────────────────────────
  async anonymizeUser(userId: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { success: false };

    // Clean up Cloudinary assets safely
    try {
      await this.uploadsService.deleteUserAssets(
        user.avatarPublicId,
        user.idCardPublicId,
      );
    } catch (err: any) {
      console.warn(
        '[anonymizeUser] Cloudinary asset cleanup notice:',
        err?.message || err,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isActive: false,
        name: 'مستخدم محذوف',
        avatarUrl: null,
        avatarPublicId: null,
        idCardPublicId: null,
        deletionStatus: AccountDeletionStatus.PURGED,
      },
    });

    return { success: true };
  }

  // ── 8. Admin List Account Lifecycle Requests ──────────────────────────────
  async getAccountLifecycleUsers(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
  ) {
    // Run background check for expired grace periods
    this.processExpiredAccountDeletions().catch(() => {});

    const skip = (page - 1) * limit;

    const whereClause: any = {
      OR: [{ isDeleted: true }, { deletionStatus: { not: null } }],
    };

    if (status && status !== 'all') {
      whereClause.deletionStatus = status as AccountDeletionStatus;
    }

    if (search) {
      const trimmed = search.trim();
      whereClause.AND = [
        {
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { phone: { contains: trimmed, mode: 'insensitive' } },
            { email: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const safeUsers = users.map((user) => {
      const { passwordHash: _ph, ...safeUser } = user;
      return safeUser;
    });

    return {
      users: safeUsers,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // ── Admin: Delete User (Purge/Anonymize) ───────────────────────────────
  async deleteUserByAdmin(userId: string): Promise<{ message: string }> {
    await this.anonymizeUser(userId);
    return { message: 'User account anonymized and purged by admin' };
  }

  // ── Admin: Create User Manually ─────────────────────────────────────────
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

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  // ── Lookup By Phone ───────────────────────────────────────────────────────
  async lookupByPhone(phone: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
    });

    if (!user) return null;

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  // ── Public Profile ────────────────────────────────────────────────────────
  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        ratingAvg: true,
        reviewsCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
