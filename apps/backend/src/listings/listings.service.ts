// apps/backend/src/listings/listings.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import {
  ListingStatus,
  UnitType,
  Prisma,
  UserRole,
  NotificationType,
  BedStatus,
} from '@prisma/client';
import { userPublicSelect } from '../common/selects/user.select';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── 1. إنشاء إعلان ──────────────────────────────────────────────────────────
  async create(landlordId: string, dto: CreateListingDto) {
    if (dto.unitType === UnitType.room) {
      throw new BadRequestException('نوع الوحدة غير مدعوم');
    }

    if (
      dto.unitType === UnitType.bed &&
      (!dto.totalBeds || dto.totalBeds < 1)
    ) {
      throw new BadRequestException(
        'يجب تحديد عدد الأسرة عندما يكون نوع الوحدة سرير',
      );
    }

    // منع تكرار الإعلانات في وقت قصير جداً (أقل من دقيقة) من نفس المؤجر لتجنب الضغط المتكرر
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentListing = await this.prisma.listing.findFirst({
      where: {
        landlordId,
        createdAt: { gte: oneMinuteAgo },
        isDeleted: false,
      },
    });

    if (recentListing) {
      throw new BadRequestException(
        'يرجى الانتظار دقيقة واحدة على الأقل بين نشر الإعلانات لتفادي التكرار.',
      );
    }

    const listing = await this.prisma.listing.create({
      data: {
        landlordId,
        title: dto.title,
        description: dto.description,
        unitType: dto.unitType,
        price: dto.price,
        securityDeposit: dto.securityDeposit,
        includesBills: dto.includesBills,
        electricityType: dto.electricityType,
        isFurnished:
          dto.unitType === UnitType.bed ? true : (dto.isFurnished ?? true),
        totalBeds: dto.totalBeds,
        availableBeds: dto.unitType === UnitType.bed ? dto.totalBeds : null,
        genderTarget: dto.genderTarget,
        governorate: dto.governorate,
        district: dto.district,
        address: dto.address,
        lat: dto.lat ?? 30.0444,
        lng: dto.lng ?? 31.2357,
        hasExactLocation: dto.hasExactLocation === true,
        amenities: dto.amenities ?? [],
        roommateFeatureEnabled: dto.roommateFeatureEnabled,
        status: ListingStatus.pending_review,
        beds:
          dto.unitType === UnitType.bed && dto.totalBeds
            ? {
                create: Array.from({ length: dto.totalBeds }).map((_, i) => ({
                  bedNumber: i + 1,
                  status: 'available',
                })),
              }
            : undefined,
      },
      include: { beds: true },
    });

    // ── إرسال إشعار فوري لجميع المسؤولين والـ Super Admins بوجود إعلان جديد ──
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
      select: { name: true },
    });
    const landlordName = landlord?.name || 'مُعلِن';

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true },
    });

    for (const admin of admins) {
      this.notificationService
        .createUnique({
          userId: admin.id,
          type: NotificationType.ALERT,
          title: 'إعلان جديد بانتظار المراجعة',
          body: `قام المؤجر "${landlordName}" بنشر إعلان جديد: "${listing.title}" وهو بانتظار المراجعة.`,
          entityType: 'LISTING',
          entityId: listing.id,
        })
        .catch(() => {});
    }

    return listing;
  }

  // ── 2. جلب جميع الإعلانات مع فلترة ──────────────────────────────────────────
  async findAll(query: ListingQueryDto) {
    const {
      page = 1,
      limit: requestedLimit = 10,
      unitType,
      governorate,
      district,
      minPrice,
      maxPrice,
      genderTarget,
      amenities,
      verifiedOnly,
    } = query;

    // Keep public listing searches bounded even when callers supply a larger limit.
    const limit = Math.min(Math.max(requestedLimit, 1), 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
      unitType: { in: [UnitType.apartment, UnitType.bed] },
      isDeleted: false,
    };

    if (unitType) {
      where.unitType = unitType === UnitType.room ? { in: [] } : unitType;
    }
    if (governorate) where.governorate = governorate;
    if (district) where.district = district;
    if (genderTarget) where.genderTarget = genderTarget;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (amenities && amenities.length > 0) {
      where.amenities = { hasSome: amenities };
    }

    if (verifiedOnly) {
      where.landlord = {
        OR: [
          { emailVerifiedAt: { not: null } },
          { phoneVerifiedAt: { not: null } },
        ],
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1, // إرجاع أول صورة فقط في قائمة الإعلانات لتسريع الاستجابة
          },
          landlord: {
            select: {
              ...userPublicSelect,
              _count: {
                select: { listings: true },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // ── 3. عرض تفاصيل إعلان واحد ──────────────────────────────────────────────
  async findOne(id: string, includeDeleted = false) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        beds: {
          orderBy: { bedNumber: 'asc' },
        },
        landlord: {
          select: {
            ...userPublicSelect,
            _count: {
              select: { listings: true },
            },
          },
        },
        currentTenant: {
          select: userPublicSelect,
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    // Soft-deleted listings are invisible to everyone except admin
    if (listing.isDeleted && !includeDeleted) {
      throw new NotFoundException('هذا الإعلان لم يعد متاحاً');
    }

    return listing;
  }

  // ── 4. تحديث الإعلان (للمؤجر) ─────────────────────────────────────────────
  async update(id: string, landlordId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.isDeleted) {
      throw new NotFoundException('هذا الإعلان لم يعد متاحاً');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الإعلان');
    }

    // إذا تغير نوع الوحدة إلى bed ولم تكن bed من قبل، فهذا يتطلب منطق معقد أو نمنعه
    if (dto.unitType && dto.unitType !== listing.unitType) {
      throw new BadRequestException('لا يمكن تغيير نوع الوحدة بعد الإنشاء');
    }

    const updateData: any = { ...dto, status: ListingStatus.pending_review };

    if (dto.hasExactLocation !== undefined) {
      updateData.hasExactLocation = dto.hasExactLocation === true;
    }

    return this.prisma.listing.update({
      where: { id },
      data: updateData,
    });
  }

  // ── 5. حذف الإعلان (Soft Delete للمؤجر) ──────────────────────────────────
  async remove(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        landlord: { select: { name: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.isDeleted) {
      throw new NotFoundException('الإعلان محذوف بالفعل');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا الإعلان');
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete
      await tx.listing.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: landlordId,
          deletedByRole: UserRole.landlord,
          statusBeforeDelete: listing.status,
        },
      });

      // Write audit log
      await tx.listingAuditLog.create({
        data: {
          listingId: id,
          listingTitleSnapshot: listing.title,
          actorId: landlordId,
          actorRole: UserRole.landlord,
          actorName: listing.landlord?.name ?? 'مؤجر',
          action: 'soft_delete',
          detail: 'حذف من قبل المؤجر',
        },
      });
    });

    return { message: 'تم حذف الإعلان بنجاح' };
  }

  // ── 6. جلب إعلانات المؤجر ──────────────────────────────────────────────────
  async getMyListings(landlordId: string) {
    return this.prisma.listing.findMany({
      where: {
        landlordId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        currentTenant: {
          select: userPublicSelect,
        },
      },
    });
  }

  async getMyListingsPaginated(
    landlordId: string,
    page: number = 1,
    requestedLimit: number = 10,
    status?: string,
    search?: string,
  ) {
    const limit = Math.min(Math.max(requestedLimit, 1), 10);
    const safePage = Math.max(page, 1);
    const where: Prisma.ListingWhereInput = {
      landlordId,
      isDeleted: false,
    };

    if (status) {
      if (!Object.values(ListingStatus).includes(status as ListingStatus)) {
        throw new BadRequestException('حالة الإعلان غير صالحة');
      }
      where.status = status as ListingStatus;
    }

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      where.OR = [
        { title: { contains: normalizedSearch, mode: 'insensitive' } },
        { district: { contains: normalizedSearch, mode: 'insensitive' } },
        { governorate: { contains: normalizedSearch, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          currentTenant: {
            select: userPublicSelect,
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      meta: {
        total,
        page: safePage,
        limit,
        lastPage: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ── 6.1. إعادة نشر الإعلان المتوقف ──────────────────────────────────────────
  async republishListing(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing || listing.isDeleted) {
      throw new NotFoundException('الإعلان غير موجود أو تم حذفه');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لإعادة نشر هذا الإعلان');
    }

    if (listing.status !== ListingStatus.paused) {
      throw new BadRequestException('يمكن إعادة نشر الإعلانات المتوقفة فقط');
    }

    if (listing.unitType === UnitType.bed) {
      const availableBeds = await this.prisma.listingBed.count({
        where: { listingId: id, status: BedStatus.available },
      });
      const newStatus =
        availableBeds === 0 ? ListingStatus.rented : ListingStatus.active;

      return this.prisma.listing.update({
        where: { id },
        data: {
          status: newStatus,
          availableBeds,
        },
      });
    } else {
      return this.prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.active,
          currentTenantId: null,
          rentedSince: null,
          rentedUntil: null,
        },
      });
    }
  }

  // ── 7. إخلاء الوحدة ──────────────────────────────────────────────────────
  async vacateListing(
    id: string,
    tx: Prisma.TransactionClient,
    forcePause: boolean = false,
  ) {
    return tx.listing.update({
      where: { id },
      data: {
        status: forcePause ? ListingStatus.paused : ListingStatus.active,
        currentTenantId: null,
        rentedSince: null,
        rentedUntil: null,
      },
    });
  }

  async vacateUnit(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('العقار غير موجود');
    }

    if (listing.isDeleted) {
      throw new NotFoundException('هذا الإعلان لم يعد متاحاً');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لإدارة هذا العقار');
    }

    if (listing.unitType === UnitType.bed) {
      throw new BadRequestException(
        'استخدم إدارة الأسرة لإخلاء إعلانات الأسرة',
      );
    }

    if (listing.status !== ListingStatus.rented || !listing.currentTenantId) {
      throw new BadRequestException('هذا العقار غير مؤجر حالياً');
    }

    const updatedListing = await this.prisma.$transaction(async (tx) => {
      // Automatically terminate any active contract for this listing
      const activeContract = await tx.rentalContract.findFirst({
        where: { listingId: id, status: 'active' },
      });
      if (activeContract) {
        await tx.rentalContract.update({
          where: { id: activeContract.id },
          data: {
            status: 'terminated',
            actualCheckout: new Date(),
            terminationReason: 'landlord_request',
            terminationNotes: 'تم الإخلاء يدوياً من لوحة المؤجر',
          },
        });
      }

      return this.vacateListing(id, tx, false);
    });

    return {
      message: 'تم إخلاء العقار بنجاح',
      listing: updatedListing,
    };
  }

  // ── 8. زيادة عدد المشاهدات ──────────────────────────────────────────────
  async incrementViewCount(id: string, userId?: string) {
    if (!userId) {
      return;
    }

    try {
      const listing = await this.prisma.listing.findUnique({
        where: { id },
        select: {
          id: true,
          landlordId: true,
          viewCount: true,
          isDeleted: true,
        },
      });

      if (!listing || listing.isDeleted) {
        return;
      }

      if (listing.landlordId === userId) {
        return { id: listing.id, viewCount: listing.viewCount };
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.viewedListing.create({
          data: { listingId: id, userId },
        });

        return tx.listing.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
          select: { id: true, viewCount: true },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return this.prisma.listing.findUnique({
          where: { id },
          select: { id: true, viewCount: true },
        });
      }
      // نتجاهل الخطأ إن لم يكن الإعلان موجوداً لتجنب مشكلة أثناء الـ View
    }
  }
}
