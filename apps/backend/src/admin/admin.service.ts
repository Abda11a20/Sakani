// apps/backend/src/admin/admin.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewListingDto } from './dto/review-listing.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ListingStatus, UserRole } from '@prisma/client';
import { decryptAES } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── إدارة الإعلانات ────────────────────────────────────────────────────────
  async getAllListings(page: number = 1, limit: number = 10, status?: ListingStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          landlord: {
            select: { id: true, name: true, phone: true, avatarUrl: true, emailVerifiedAt: true },
          },
          images: { orderBy: { order: 'asc' } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  async reviewListing(listingId: string, adminId: string, dto: ReviewListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    const data: any = { status: dto.status };

    if (dto.status === ListingStatus.rejected) {
      data.rejectionReason = dto.rejectionReason;
    } else {
      data.rejectionReason = null; // تنظيف السبب القديم إن كان تم قبوله
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data,
    });
  }

  async deleteListingPermanently(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.prisma.listing.delete({ where: { id: listingId } });
    return { message: 'Listing deleted permanently' };
  }

  async getAllRequests(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];
    if (status) andConditions.push({ status });
    if (search) {
      andConditions.push({
        OR: [
          { tenant: { name: { contains: search, mode: 'insensitive' } } },
          { listing: { title: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }
    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [requests, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, phone: true } },
          listing: { select: { id: true, title: true, landlordId: true } },
        },
      }),
      this.prisma.viewingRequest.count({ where }),
    ]);

    return { requests, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  // ── إدارة المستخدمين ──────────────────────────────────────────────────────
  async getAllUsers(page: number = 1, limit: number = 10, role?: UserRole, search?: string, isActive?: string, isVerified?: string) {
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];
    if (role) andConditions.push({ role });
    
    if (isActive === 'true') andConditions.push({ isActive: true });
    else if (isActive === 'false') andConditions.push({ isActive: false });

    if (isVerified === 'true') andConditions.push({ emailVerifiedAt: { not: null } });
    else if (isVerified === 'false') andConditions.push({ emailVerifiedAt: null });
    
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // إزالة الحقول الحساسة، مع فك تشفير الرقم القومي للعرض الإداري
    const safeUsers = users.map((user) => {
      const { passwordHash: _ph, nationalIdEnc, ...safeUser } = user;
      let nationalId: string | null = null;
      if (nationalIdEnc) {
        try {
          // nationalIdEnc format: "hash:encryptedData"
          const encryptedPart = nationalIdEnc.split(':').slice(1).join(':');
          nationalId = encryptedPart ? decryptAES(encryptedPart) : null;
        } catch {
          nationalId = null; // فك التشفير فشل — نتجاهل بصمت
        }
      }
      return { ...safeUser, nationalId };
    });

    return { users: safeUsers, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  async verifyUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), phoneVerifiedAt: new Date(), nationalIdVerified: true },
    });
  }

  async toggleUserStatus(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    if (user.role === UserRole.super_admin) {
      throw new ForbiddenException('لا يمكن إيقاف حساب super_admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async updateUserRole(userId: string, superAdminId: string, dto: UpdateUserRoleDto) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('المستخدم غير موجود');

    if (targetUser.role === UserRole.super_admin) {
      throw new ForbiddenException('لا يمكن تغيير دور super_admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });
  }

  // ── نظام الحظر (Blacklist) ────────────────────────────────────────────────
  async banUser(adminId: string, dto: BanUserDto) {
    if (!dto.nationalIdHash && !dto.phone) {
      throw new BadRequestException('يجب توفير إما nationalIdHash أو phone لحظر المستخدم');
    }

    // إضافة للـ blacklist
    const blacklisted = await this.prisma.blacklist.create({
      data: {
        nationalIdHash: dto.nationalIdHash,
        phone: dto.phone,
        reason: dto.reason,
        bannedBy: adminId,
      },
    });

    // إيقاف حسابات المستخدمين المرتبطين (سواء بالموبايل أو الهاش)
    const orConditions: any[] = [];
    if (dto.phone) orConditions.push({ phone: dto.phone });
    
    // ملاحظة: الـ user table ليس به nationalIdHash منفصل (لدينا nationalIdEnc).
    // إذا كنت تخزن الهاش مدمجاً في nationalIdEnc فأنت بحاجة لمطابقته (Starts With Hash).
    // ولكن لإيقاف الحسابات هنا، سنقوم بالبحث برقم الموبايل أساسياً إن توفر،
    // أو عبر إحضار الكل والمطابقة، أو يمكن تجاهل الإيقاف التلقائي بالـ Hash وتركها للحظر المستقبلي.
    // للمطابقة مع nationalIdEnc الذي يبدأ بـ hash:
    if (dto.nationalIdHash) {
      orConditions.push({ nationalIdEnc: { startsWith: dto.nationalIdHash + ':' } });
    }

    if (orConditions.length > 0) {
      await this.prisma.user.updateMany({
        where: { OR: orConditions, role: { not: UserRole.super_admin } },
        data: { isActive: false },
      });
    }

    return blacklisted;
  }

  async getBannedUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [banned, total] = await Promise.all([
      this.prisma.blacklist.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blacklist.count(),
    ]);

    return { banned, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  async unbanUser(blacklistId: string, superAdminId: string) {
    const blacklisted = await this.prisma.blacklist.findUnique({
      where: { id: blacklistId },
    });

    if (!blacklisted) {
      throw new NotFoundException('عنصر الحظر غير موجود');
    }

    // نحذف من البلاك ليست
    await this.prisma.blacklist.delete({ where: { id: blacklistId } });

    // إعادة تفعيل أي حساب مرتبط
    const orConditions: any[] = [];
    if (blacklisted.phone) orConditions.push({ phone: blacklisted.phone });
    if (blacklisted.nationalIdHash) {
      orConditions.push({ nationalIdEnc: { startsWith: blacklisted.nationalIdHash + ':' } });
    }

    if (orConditions.length > 0) {
      await this.prisma.user.updateMany({
        where: { OR: orConditions },
        data: { isActive: true },
      });
    }

    return { message: 'تم إلغاء الحظر وإعادة التفعيل بنجاح' };
  }

  // ── الإحصائيات (Dashboard) ───────────────────────────────────────────────
  async getDashboardStats() {
    const [
      totalUsers,
      totalListings,
      pendingListings,
      activeListings,
      totalRequests,
      pendingRequests,
      bannedUsers,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: ListingStatus.pending_review } }),
      this.prisma.listing.count({ where: { status: ListingStatus.active } }),
      this.prisma.viewingRequest.count(),
      this.prisma.viewingRequest.count({ where: { status: 'pending' } }),
      this.prisma.blacklist.count(),
    ]);

    return {
      totalUsers,
      totalListings,
      pendingListings,
      activeListings,
      totalRequests,
      pendingRequests,
      bannedUsers,
    };
  }
}
