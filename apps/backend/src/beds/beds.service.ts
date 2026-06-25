// apps/backend/src/beds/beds.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RentBedDto } from './dto/rent-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { BedStatus, ListingStatus } from '@prisma/client';

@Injectable()
export class BedsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. جلب كل الأسرة في إعلان معين ──────────────────────────────────────────
  async getListingBeds(listingId: string, isLandlord: boolean) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    // العامة يشوفوا فقط الأسرة المتاحة، المالك يشوف كل الأسرة
    const statusFilter = isLandlord ? undefined : BedStatus.available;

    return this.prisma.listingBed.findMany({
      where: {
        listingId,
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: { bedNumber: 'asc' },
    });
  }

  // ── 2. جلب تفاصيل سرير واحد ────────────────────────────────────────────────
  async getBedDetails(bedId: string) {
    const bed = await this.prisma.listingBed.findUnique({
      where: { id: bedId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            landlordId: true,
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('السرير غير موجود');
    }

    return bed;
  }

  // ── 3. تأجير سرير (Landlord فقط) ───────────────────────────────────────────
  async rentBed(bedId: string, landlordId: string, dto: RentBedDto) {
    // 1. استخدام Transaction لضمان سلامة البيانات
    return this.prisma.$transaction(async (tx) => {
      // التحقق من وجود السرير والإعلان
      const bed = await tx.listingBed.findUnique({
        where: { id: bedId },
        include: { listing: true },
      });

      if (!bed) {
        throw new NotFoundException('السرير غير موجود');
      }

      // التحقق من الصلاحيات
      if (bed.listing.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لإدارة هذا السرير');
      }

      // التحقق من حالة السرير
      if (bed.status !== BedStatus.available) {
        throw new BadRequestException('هذا السرير غير متاح للتأجير حالياً');
      }

      // 2. تحديث السرير ليصبح مؤجراً
      const updatedBed = await tx.listingBed.update({
        where: { id: bedId },
        data: {
          status: BedStatus.rented,
          currentTenantId: dto.tenantId,
          rentedSince: dto.rentedSince,
          rentedUntil: dto.rentedUntil,
        },
      });

      // 3. تحديث availableBeds في الإعلان
      const newAvailableBeds = Math.max(0, (bed.listing.availableBeds ?? 0) - 1);
      
      const listingUpdateData: any = {
        availableBeds: newAvailableBeds,
      };

      // 4. إذا أصبح availableBeds = 0، تحويل الإعلان لـ rented
      if (newAvailableBeds === 0) {
        listingUpdateData.status = ListingStatus.rented;
      }

      await tx.listing.update({
        where: { id: bed.listingId },
        data: listingUpdateData,
      });

      return {
        message: 'تم تأجير السرير بنجاح',
        bed: updatedBed,
      };
    });
  }

  // ── 4. إخلاء سرير (Landlord فقط) ───────────────────────────────────────────
  async vacateBed(bedId: string, landlordId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bed = await tx.listingBed.findUnique({
        where: { id: bedId },
        include: { listing: true },
      });

      if (!bed) {
        throw new NotFoundException('السرير غير موجود');
      }

      if (bed.listing.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لإدارة هذا السرير');
      }

      if (bed.status !== BedStatus.rented) {
        throw new BadRequestException('هذا السرير غير مؤجر ليتم إخلاؤه');
      }

      // 1. تحديث السرير ليصبح متاحاً وتفريغ بيانات المستأجر
      const updatedBed = await tx.listingBed.update({
        where: { id: bedId },
        data: {
          status: BedStatus.available,
          currentTenantId: null,
          rentedSince: null,
          rentedUntil: null,
        },
      });

      // 2. تحديث availableBeds في الإعلان
      const newAvailableBeds = (bed.listing.availableBeds ?? 0) + 1;
      
      const listingUpdateData: any = {
        availableBeds: newAvailableBeds,
      };

      // 3. إذا كان الإعلان rented، يتم إرجاعه لـ active لأنه أصبح هناك سرير متاح
      if (bed.listing.status === ListingStatus.rented) {
        listingUpdateData.status = ListingStatus.active;
      }

      await tx.listing.update({
        where: { id: bed.listingId },
        data: listingUpdateData,
      });

      return {
        message: 'تم إخلاء السرير بنجاح',
        bed: updatedBed,
      };
    });
  }

  // ── 5. تغيير نوع السرير ──────────────────────────────────────────────────
  async updateBedType(bedId: string, landlordId: string, dto: UpdateBedDto) {
    const bed = await this.prisma.listingBed.findUnique({
      where: { id: bedId },
      include: { listing: true },
    });

    if (!bed) {
      throw new NotFoundException('السرير غير موجود');
    }

    if (bed.listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لإدارة هذا السرير');
    }

    if (!dto.bedType) {
      return bed;
    }

    return this.prisma.listingBed.update({
      where: { id: bedId },
      data: { bedType: dto.bedType },
    });
  }

  // ── 6. جلب إحصائيات الأسرة لإعلان معين ──────────────────────────────────
  async getListingBedStats(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    const [totalBeds, availableBeds, rentedBeds] = await Promise.all([
      this.prisma.listingBed.count({ where: { listingId } }),
      this.prisma.listingBed.count({ where: { listingId, status: BedStatus.available } }),
      this.prisma.listingBed.count({ where: { listingId, status: BedStatus.rented } }),
    ]);

    return {
      totalBeds,
      availableBeds,
      rentedBeds,
    };
  }
}
