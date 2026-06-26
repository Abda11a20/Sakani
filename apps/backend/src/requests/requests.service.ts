// apps/backend/src/requests/requests.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestStatus, ListingStatus, UserRole } from '@prisma/client';
import { userPublicSelect } from '../common/selects/user.select';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. إنشاء طلب معاينة (Tenant فقط) ──────────────────────────────────────
  async create(tenantId: string, dto: CreateRequestDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.status !== ListingStatus.active) {
      throw new BadRequestException('لا يمكن إرسال طلب لهذا الإعلان لأنه غير نشط حالياً');
    }

    // التحقق من عدم وجود طلب معلق مسبقاً لنفس الإعلان من نفس المستأجر
    const existingPendingRequest = await this.prisma.viewingRequest.findFirst({
      where: {
        tenantId,
        listingId: dto.listingId,
        status: RequestStatus.pending,
      },
    });

    if (existingPendingRequest) {
      throw new ConflictException('لقد قمت بإرسال طلب لهذا الإعلان وهو قيد الانتظار');
    }

    const request = await this.prisma.viewingRequest.create({
      data: {
        tenantId,
        listingId: dto.listingId,
        preferredDate: dto.preferredDate,
        message: dto.message,
        specialty: dto.specialty,
        status: RequestStatus.pending,
      },
      include: {
        listing: {
          include: {
            landlord: {
              select: userPublicSelect,
            },
          },
        },
        tenant: {
          select: {
            ...userPublicSelect,
            phone: true,
          },
        },
      },
    });

    return request;
  }

  // ── 2. جلب طلبات المستأجر ────────────────────────────────────────────────
  async getMyRequestsAsTenant(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              landlord: {
                select: userPublicSelect,
              },
            },
          },
        },
      }),
      this.prisma.viewingRequest.count({ where: { tenantId } }),
    ]);

    return { requests, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  // ── 3. جلب الطلبات الواردة للمؤجر ─────────────────────────────────────────
  async getMyRequestsAsLandlord(landlordId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = { listing: { landlordId } };

    const [requests, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, unitType: true } },
          tenant: {
            select: {
              ...userPublicSelect,
              phone: true,
            },
          },
        },
      }),
      this.prisma.viewingRequest.count({ where }),
    ]);

    return { requests, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  // ── 4. جلب تفاصيل طلب واحد ───────────────────────────────────────────────
  async getRequestDetails(requestId: string, userId: string, role: UserRole) {
    const request = await this.prisma.viewingRequest.findUnique({
      where: { id: requestId },
      include: {
        listing: {
          include: {
            landlord: {
              select: {
                ...userPublicSelect,
                phone: true,
              },
            },
          },
        },
        tenant: {
          select: {
            ...userPublicSelect,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('الطلب غير موجود');
    }

    const isTenant = request.tenantId === userId;
    const isLandlord = request.listing.landlordId === userId;
    const isAdmin = role === UserRole.admin || role === UserRole.super_admin;

    if (!isTenant && !isLandlord && !isAdmin) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الطلب');
    }

    return request;
  }

  // ── 5. تحديث حالة الطلب (Landlord فقط) ───────────────────────────────────
  async updateStatus(requestId: string, landlordId: string, dto: UpdateRequestStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.viewingRequest.findUnique({
        where: { id: requestId },
        include: { listing: true },
      });

      if (!request) {
        throw new NotFoundException('الطلب غير موجود');
      }

      if (request.listing.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لتعديل حالة هذا الطلب');
      }

      const updatedRequest = await tx.viewingRequest.update({
        where: { id: requestId },
        data: { status: dto.status },
      });

      // إذا تم إكمال الطلب (completed) للإعلان ككل، قم بتغيير حالة الإعلان لـ rented
      // ملاحظة: لو كان unitType === bed، ربما يكون المنطق مختلف (يعتمد على حجز الأسرة)،
      // لكن حسب المتطلبات: "يغير حالة الـ listing لـ rented تلقائياً"
      if (dto.status === RequestStatus.completed) {
        await tx.listing.update({
          where: { id: request.listingId },
          data: { status: ListingStatus.rented },
        });
      }

      return updatedRequest;
    });
  }

  // ── 6. إلغاء الطلب (Tenant فقط) ──────────────────────────────────────────
  async cancelRequest(requestId: string, tenantId: string) {
    const request = await this.prisma.viewingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا الطلب');
    }

    if (request.status !== RequestStatus.pending) {
      throw new BadRequestException('لا يمكن إلغاء الطلب إلا إذا كان قيد الانتظار');
    }

    await this.prisma.viewingRequest.delete({
      where: { id: requestId },
    });

    return { message: 'تم إلغاء الطلب بنجاح' };
  }

  // ── 7. جلب إحصائيات المؤجر ───────────────────────────────────────────────
  async getRequestStats(landlordId: string) {
    const where = { listing: { landlordId } };

    const [totalRequests, pendingRequests, acceptedRequests, rejectedRequests, completedRequests] = await Promise.all([
      this.prisma.viewingRequest.count({ where }),
      this.prisma.viewingRequest.count({ where: { ...where, status: RequestStatus.pending } }),
      this.prisma.viewingRequest.count({ where: { ...where, status: RequestStatus.accepted } }),
      this.prisma.viewingRequest.count({ where: { ...where, status: RequestStatus.rejected } }),
      this.prisma.viewingRequest.count({ where: { ...where, status: RequestStatus.completed } }),
    ]);

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      completedRequests,
    };
  }
}
