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
import { ListingStatus, NotificationType, UserRole, IdentityStatus } from '@prisma/client';
import { decryptAES } from '../auth/auth.service';
import { userPublicSelect } from '../common/selects/user.select';
import { NotificationService } from '../notifications/notifications.service';
import { AlertsService } from '../alerts/alerts.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly alertsService: AlertsService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ── إدارة الإعلانات ────────────────────────────────────────────────────────
  async getAllListings(page: number = 1, limit: number = 10, status?: ListingStatus) {
    const skip = (page - 1) * limit;
    const where = status
      ? { status, isDeleted: false }
      : { isDeleted: false };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          landlord: {
            select: {
              ...userPublicSelect,
              phone: true,
            },
          },
          images: { orderBy: { order: 'asc' } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  // ── جلب الإعلانات المحذوفة (الأرشيف) ─────────────────────────────────────
  async getDeletedListings(
    page: number = 1,
    limit: number = 10,
    deletedByRole?: string,
    search?: string,
    from?: string,
    to?: string,
  ) {
    const skip = (page - 1) * limit;

    const andConditions: any[] = [{ isDeleted: true }];

    if (deletedByRole && deletedByRole !== 'all') {
      andConditions.push({ deletedByRole });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { landlord: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (from || to) {
      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      andConditions.push({ deletedAt: dateFilter });
    }

    const where = { AND: andConditions };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        include: {
          landlord: {
            select: {
              ...userPublicSelect,
              phone: true,
            },
          },
          images: { orderBy: { order: 'asc' } },
          _count: { select: { images: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  // ── Soft Delete من الأدمن ───────────────────────────────────────────────────
  async softDeleteListing(listingId: string, adminId: string, reason?: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, role: true },
    });
    if (!admin) throw new NotFoundException('الأدمن غير موجود');

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.isDeleted) throw new BadRequestException('الإعلان محذوف بالفعل');

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: adminId,
          deletedByRole: admin.role,
          deletedReason: reason ?? null,
          statusBeforeDelete: listing.status,
        },
      });

      await tx.listingAuditLog.create({
        data: {
          listingId,
          listingTitleSnapshot: listing.title,
          actorId: adminId,
          actorRole: admin.role,
          actorName: admin.name,
          action: 'soft_delete',
          detail: reason ?? 'حذف من قبل الأدمن',
        },
      });
    });

    return { message: 'تم حذف الإعلان بنجاح' };
  }

  // ── Restore الإعلان ────────────────────────────────────────────────────────
  async restoreListing(listingId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, role: true },
    });
    if (!admin) throw new NotFoundException('الأدمن غير موجود');

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (!listing.isDeleted) throw new BadRequestException('الإعلان غير محذوف');

    // Restore to previous status, fallback to pending_review
    const restoredStatus = listing.statusBeforeDelete ?? ListingStatus.pending_review;

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
          deletedByRole: null,
          deletedReason: null,
          statusBeforeDelete: null,
          status: restoredStatus,
        },
      });

      await tx.listingAuditLog.create({
        data: {
          listingId,
          listingTitleSnapshot: listing.title,
          actorId: adminId,
          actorRole: admin.role,
          actorName: admin.name,
          action: 'restore',
          detail: `تم الاسترجاع — الحالة السابقة: ${restoredStatus}`,
        },
      });
    });

    return { message: 'تم استرجاع الإعلان بنجاح', restoredStatus };
  }

  // ── حذف صور الإعلان فقط ──────────────────────────────────────────────────
  async deleteListingImages(listingId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, role: true },
    });
    if (!admin) throw new NotFoundException('الأدمن غير موجود');

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');

    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
    });

    // Delete files from storage
    await Promise.allSettled(
      images.map(async (img) => {
        try {
          await this.uploadsService.deleteFileByKey(img.s3Key);
        } catch {
          // Ignore individual file deletion errors
        }
      }),
    );

    // Delete image records from DB
    await this.prisma.listingImage.deleteMany({ where: { listingId } });

    // Write audit log
    await this.prisma.listingAuditLog.create({
      data: {
        listingId,
        listingTitleSnapshot: listing.title,
        actorId: adminId,
        actorRole: admin.role,
        actorName: admin.name,
        action: 'delete_images',
        detail: `حذف ${images.length} صورة`,
      },
    });

    return { message: `تم حذف ${images.length} صورة بنجاح`, deletedCount: images.length };
  }

  async reviewListing(listingId: string, adminId: string, dto: ReviewListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.isDeleted) {
      throw new BadRequestException('لا يمكن مراجعة إعلان محذوف');
    }

    const data: any = { status: dto.status };

    if (dto.status === ListingStatus.rejected) {
      data.rejectionReason = dto.rejectionReason;
    } else {
      data.rejectionReason = null; // تنظيف السبب القديم إن كان تم قبوله
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data,
      });

      if (dto.status === ListingStatus.active || dto.status === ListingStatus.rejected) {
        const isApproved = dto.status === ListingStatus.active;

        await this.notificationService.createUnique(
          {
            userId: listing.landlordId,
            type: NotificationType.SYSTEM,
            title: isApproved ? 'Listing approved' : 'Listing rejected',
            body: isApproved
              ? `Your listing "${listing.title}" has been approved and is now visible.`
              : `Your listing "${listing.title}" was rejected.`,
            entityType: isApproved ? 'listing.approved' : 'listing.rejected',
            entityId: listing.id,
          },
          tx,
        );

        if (isApproved) {
          await this.alertsService.checkAndNotify(updatedListing.id, tx);
        }
      }

      return updatedListing;
    });
  }

  // ── الحذف النهائي (بعد Pre-flight checks) ─────────────────────────────────
  async deleteListingPermanently(listingId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, role: true },
    });
    if (!admin) throw new NotFoundException('الأدمن غير موجود');

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('الإعلان غير موجود');

    // Pre-flight check 1: Must be soft-deleted first
    if (!listing.isDeleted) {
      throw new BadRequestException(
        'يجب أرشفة الإعلان أولاً قبل الحذف النهائي. استخدم "أرشفة" أولاً.',
      );
    }

    // Pre-flight check 2: No active viewing requests
    const activeRequests = await this.prisma.viewingRequest.count({
      where: {
        listingId,
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (activeRequests > 0) {
      throw new BadRequestException(
        `يوجد ${activeRequests} طلب معاينة نشط مرتبط بهذا الإعلان. يجب إنهاؤها أولاً.`,
      );
    }

    // Pre-flight check 3: No active current tenant
    if (listing.currentTenantId) {
      throw new BadRequestException(
        'يوجد مستأجر نشط مرتبط بهذا الإعلان. يجب إخلاء الوحدة أولاً.',
      );
    }

    // Delete images from storage
    const images = await this.prisma.listingImage.findMany({ where: { listingId } });

    await Promise.allSettled(
      images.map(async (img) => {
        try {
          await this.uploadsService.deleteFileByKey(img.s3Key);
        } catch {
          // Ignore individual storage errors
        }
      }),
    );

    // Write audit log and delete in transaction
    const titleSnapshot = listing.title;

    await this.prisma.$transaction(async (tx) => {
      // Permanently delete
      await tx.listing.delete({ where: { id: listingId } });

      // Write audit log
      await tx.listingAuditLog.create({
        data: {
          listingId,
          listingTitleSnapshot: titleSnapshot,
          actorId: adminId,
          actorRole: admin.role,
          actorName: admin.name,
          action: 'permanent_delete',
          detail: 'حذف نهائي للإعلان من قاعدة البيانات',
        },
      });
    });

    return { message: `تم الحذف النهائي للإعلان: "${titleSnapshot}"` };
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
      data: {
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
        phoneVerifiedAt: user.phoneVerifiedAt || new Date(),
        nationalIdVerified: true,
        identityStatus: IdentityStatus.VERIFIED,
      },
    });
  }

  async rejectUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        nationalIdVerified: false,
        identityStatus: IdentityStatus.REJECTED,
      },
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

    let nationalIdHash = dto.nationalIdHash;
    const phone = dto.phone;

    // Smart Blacklist: If phone is provided, lookup the user in the database
    // and extract their official nationalIdHash if it exists, to override or supplement the frontend input
    if (phone) {
      const user = await this.prisma.user.findFirst({
        where: { phone },
      });
      if (user && user.nationalIdEnc) {
        const parts = user.nationalIdEnc.split(':');
        if (parts[0]) {
          nationalIdHash = parts[0]; // Override with official database hash
        }
      }
    }

    // إضافة للـ blacklist
    const blacklisted = await this.prisma.blacklist.create({
      data: {
        nationalIdHash,
        phone,
        reason: dto.reason,
        bannedBy: adminId,
      },
    });

    // إيقاف حسابات المستخدمين المرتبطين (سواء بالموبايل أو الهاش)
    const orConditions: any[] = [];
    if (phone) orConditions.push({ phone });
    if (nationalIdHash) {
      orConditions.push({ nationalIdEnc: { startsWith: nationalIdHash + ':' } });
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
      archivedListings,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.listing.count({ where: { isDeleted: false } }),
      this.prisma.listing.count({ where: { status: ListingStatus.pending_review, isDeleted: false } }),
      this.prisma.listing.count({ where: { status: ListingStatus.active, isDeleted: false } }),
      this.prisma.viewingRequest.count(),
      this.prisma.viewingRequest.count({ where: { status: 'pending' } }),
      this.prisma.blacklist.count(),
      this.prisma.listing.count({ where: { isDeleted: true } }),
    ]);

    return {
      totalUsers,
      totalListings,
      pendingListings,
      activeListings,
      totalRequests,
      pendingRequests,
      bannedUsers,
      archivedListings,
    };
  }
}
