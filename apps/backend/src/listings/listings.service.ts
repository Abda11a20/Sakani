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
import { ListingStatus, UnitType, Prisma } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  // ── 1. إنشاء إعلان ──────────────────────────────────────────────────────────
  async create(landlordId: string, dto: CreateListingDto) {
    if (dto.unitType === UnitType.bed && (!dto.totalBeds || dto.totalBeds < 1)) {
      throw new BadRequestException('يجب تحديد عدد الأسرة عندما يكون نوع الوحدة سرير');
    }

    // منع تكرار الإعلانات في وقت قصير جداً (أقل من دقيقة) من نفس المؤجر لتجنب الضغط المتكرر
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentListing = await this.prisma.listing.findFirst({
      where: {
        landlordId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentListing) {
      throw new BadRequestException('يرجى الانتظار دقيقة واحدة على الأقل بين نشر الإعلانات لتفادي التكرار.');
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
        totalBeds: dto.totalBeds,
        availableBeds: dto.unitType === UnitType.bed ? dto.totalBeds : null,
        genderTarget: dto.genderTarget,
        governorate: dto.governorate,
        district: dto.district,
        address: dto.address,
        lat: dto.lat ?? 30.0444,
        lng: dto.lng ?? 31.2357,
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

    // Fire-and-forget: notify matched alerts (no await — don't block response)
    void this.alertsService.checkAndNotify(listing.id);

    return listing;
  }

  // ── 2. جلب جميع الإعلانات مع فلترة ──────────────────────────────────────────
  async findAll(query: ListingQueryDto) {
    const {
      page = 1,
      limit = 12,
      unitType,
      governorate,
      district,
      minPrice,
      maxPrice,
      genderTarget,
      amenities,
      verifiedOnly,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
    };

    if (unitType) where.unitType = unitType;
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
      where.landlord = { emailVerifiedAt: { not: null } };
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
              id: true,
              name: true,
              avatarUrl: true,
              emailVerifiedAt: true,
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
  async findOne(id: string) {
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
            id: true,
            name: true,
            avatarUrl: true,
            emailVerifiedAt: true,
            phone: true, // قد نحتاجه للتواصل بعد قبول الطلب، يمكن إخفاءه هنا إن لزم
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    return listing;
  }

  // ── 4. تحديث الإعلان (للمؤجر) ─────────────────────────────────────────────
  async update(id: string, landlordId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الإعلان');
    }

    // إذا تغير نوع الوحدة إلى bed ولم تكن bed من قبل، فهذا يتطلب منطق معقد أو نمنعه
    if (dto.unitType && dto.unitType !== listing.unitType) {
      throw new BadRequestException('لا يمكن تغيير نوع الوحدة بعد الإنشاء');
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        status: ListingStatus.pending_review, // أي تعديل يعيد الإعلان للمراجعة
      },
    });
  }

  // ── 5. حذف الإعلان (Soft Delete) ──────────────────────────────────────────
  async remove(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا الإعلان');
    }

    await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.paused },
    });

    return { message: 'تم إيقاف الإعلان بنجاح (نقل إلى paused)' };
  }

  // ── 6. جلب إعلانات المؤجر (كل الحالات النشطة والمراجعة والمؤجرة) ──────────────
  async getMyListings(landlordId: string) {
    return this.prisma.listing.findMany({
      where: {
        landlordId,
        status: { not: ListingStatus.paused },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });
  }

  // ── 7. زيادة عدد المشاهدات ───────────────────────────────────────────────
  async incrementViewCount(id: string) {
    try {
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch (e) {
      // نتجاهل الخطأ إن لم يكن الإعلان موجوداً لتجنب مشكلة أثناء الـ View
    }
  }
}
