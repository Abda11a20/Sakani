// apps/backend/src/alerts/alerts.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAlertDto) {
    // Verify at least one filter is set
    const hasFilter =
      dto.governorate ||
      dto.district ||
      dto.maxPrice !== undefined ||
      dto.unitType ||
      dto.genderTarget ||
      dto.specialty;

    if (!hasFilter) {
      throw new BadRequestException('يجب تحديد فلتر واحد على الأقل لإنشاء التنبيه');
    }

    return this.prisma.alert.create({
      data: {
        tenantId,
        governorate: dto.governorate,
        district: dto.district,
        maxPrice: dto.maxPrice,
        unitType: dto.unitType,
        genderTarget: dto.genderTarget,
        specialty: dto.specialty,
      },
    });
  }

  async getMyAlerts(tenantId: string) {
    return this.prisma.alert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlert(alertId: string, tenantId: string, dto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException('التنبيه غير موجود');
    }

    if (alert.tenantId !== tenantId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا التنبيه');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        governorate: dto.governorate,
        district: dto.district,
        maxPrice: dto.maxPrice,
        unitType: dto.unitType,
        genderTarget: dto.genderTarget,
        specialty: dto.specialty,
        isActive: dto.isActive,
      },
    });
  }

  async deleteAlert(alertId: string, tenantId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException('التنبيه غير موجود');
    }

    if (alert.tenantId !== tenantId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا التنبيه');
    }

    await this.prisma.alert.delete({ where: { id: alertId } });
    return { success: true, message: 'تم حذف التنبيه بنجاح' };
  }

  async toggleAlert(alertId: string, tenantId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException('التنبيه غير موجود');
    }

    if (alert.tenantId !== tenantId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا التنبيه');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isActive: !alert.isActive },
    });
  }

  async checkAndNotify(listingId: string): Promise<string[]> {
    // 1. Get the listing details
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        governorate: true,
        district: true,
        price: true,
        unitType: true,
        genderTarget: true,
      },
    });

    if (!listing) return [];

    // 2. Build dynamic where clause for matching alerts
    const where: Prisma.AlertWhereInput = {
      isActive: true,
      AND: [
        // governorate: if set in alert, must match listing
        {
          OR: [
            { governorate: null },
            { governorate: listing.governorate },
          ],
        },
        // district: if set in alert, must match listing
        {
          OR: [
            { district: null },
            { district: listing.district },
          ],
        },
        // maxPrice: if set in alert, listing price must be ≤ maxPrice
        {
          OR: [
            { maxPrice: null },
            { maxPrice: { gte: listing.price } },
          ],
        },
        // unitType: if set in alert, must match listing
        {
          OR: [
            { unitType: null },
            { unitType: listing.unitType },
          ],
        },
        // genderTarget: if set in alert, must match listing
        {
          OR: [
            { genderTarget: null },
            { genderTarget: listing.genderTarget },
          ],
        },
      ],
    };

    const matchingAlerts = await this.prisma.alert.findMany({
      where,
      select: { tenantId: true },
    });

    // Return unique tenantIds
    const tenantIds = [...new Set(matchingAlerts.map((a) => a.tenantId))];
    return tenantIds;
  }
}
