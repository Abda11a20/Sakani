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
import { FinalizeBedRentalDto } from './dto/finalize-bed-rental.dto';
import { FinalizeUnitRentalDto } from './dto/finalize-unit-rental.dto';
import { QuickRentDto } from './dto/quick-rent.dto';
import { NotificationType, RequestStatus, ListingStatus, UserRole, UnitType, BedStatus, Prisma, ContractCreatedBy } from '@prisma/client';
import { userPublicSelect } from '../common/selects/user.select';
import { BedsService } from '../beds/beds.service';
import { NotificationService } from '../notifications/notifications.service';
import { RentalContractsService } from '../rental-contracts/rental-contracts.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bedsService: BedsService,
    private readonly notificationService: NotificationService,
    private readonly rentalContractsService: RentalContractsService,
  ) {}

  // ── 0. التأجير السريع المباشر (Landlord فقط) ──────────────────────────────────
  async quickRent(landlordId: string, dto: QuickRentDto) {
    // 1. البحث عن المستأجر برقم الهاتف
    const tenant = await this.prisma.user.findFirst({
      where: { phone: dto.phone, role: UserRole.tenant },
    });
    if (!tenant) {
      throw new NotFoundException('المستأجر غير مسجل بالمنصة برقم الهاتف المدخل');
    }

    // 2. التحقق من وجود وصلاحية الإعلان
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { beds: true },
    });
    if (!listing || (listing as any).isDeleted) {
      throw new NotFoundException('العقار غير موجود أو تم حذفه');
    }
    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لتأجير هذا العقار');
    }
    if (listing.status === ListingStatus.rejected || listing.status === ListingStatus.draft) {
      throw new BadRequestException('لا يمكن تأجير العقار المرفوض أو المسودة');
    }

    // 3. التحقق من منع التأجير المكرر
    if (listing.unitType === UnitType.apartment) {
      if (listing.status === ListingStatus.rented || listing.currentTenantId) {
        throw new BadRequestException('هذا العقار مؤجر حالياً بالفعل لمستأجر آخر');
      }
    } else {
      const availableBeds = listing.availableBeds ?? 0;
      if (availableBeds === 0) {
        throw new BadRequestException('جميع الأسرة في هذا العقار مؤجرة حالياً بالفعل');
      }
    }

    // 4. إتمام المعاملة في transaction موحدة
    return this.prisma.$transaction(async (tx) => {
      // أ. إنشاء طلب معاينة مقبول تلقائياً مع علامة direct_rent
      const request = await tx.viewingRequest.create({
        data: {
          tenantId: tenant.id,
          listingId: dto.listingId,
          preferredDate: new Date(),
          status: RequestStatus.accepted,
          message: 'direct_rent', // علامة لتمييز التأجير السريع
        },
      });

      // ب. إتمام عملية التأجير الفعلي
      if (listing.unitType === UnitType.apartment) {
        const finalizeResult = await this.finalizeUnitRentalTx(request.id, landlordId, {
          rentedSince: new Date(dto.rentedSince),
          rentedUntil: new Date(dto.rentedUntil),
        }, tx);
        return finalizeResult;
      } else {
        if (!dto.bedId) {
          throw new BadRequestException('معرف السرير (bedId) مطلوب لتأجير سرير مباشر');
        }

        const chosenBed = listing.beds.find((b) => b.id === dto.bedId);
        if (!chosenBed) {
          throw new BadRequestException('السرير المحدد غير موجود في هذا الإعلان');
        }
        if (chosenBed.status !== BedStatus.available) {
          throw new BadRequestException('السرير المحدد مؤجر بالفعل أو غير متاح للتأجير');
        }

        const finalizeResult = await this.finalizeBedRentalTx(request.id, landlordId, {
          bedId: chosenBed.id,
          rentedSince: new Date(dto.rentedSince),
          rentedUntil: new Date(dto.rentedUntil),
        }, tx);
        return finalizeResult;
      }
    });
  }

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

    const request = await this.prisma.$transaction(async (tx) => {
      const createdRequest = await tx.viewingRequest.create({
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

      await this.notificationService.createUnique(
        {
          userId: listing.landlordId,
          type: NotificationType.REQUEST,
          title: 'New viewing request',
          body: `A tenant requested to view "${listing.title}".`,
          entityType: `viewing_request.created.listing.${listing.id}`,
          entityId: createdRequest.id,
        },
        tx,
      );

      return createdRequest;
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
  async getListingContactAccess(tenantId: string, listingId: string) {
    const acceptedRequest = await this.prisma.viewingRequest.findFirst({
      where: {
        tenantId,
        listingId,
        status: { in: [RequestStatus.accepted, RequestStatus.completed] },
      },
      include: {
        listing: {
          include: {
            landlord: {
              select: { phone: true },
            },
          },
        },
      },
    });

    return {
      canViewPhone: Boolean(acceptedRequest),
      phone: acceptedRequest?.listing.landlord.phone ?? null,
    };
  }

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

      if (dto.status === RequestStatus.accepted || dto.status === RequestStatus.rejected) {
        const isAccepted = dto.status === RequestStatus.accepted;

        await this.notificationService.createUnique(
          {
            userId: request.tenantId,
            type: NotificationType.REQUEST,
            title: isAccepted ? 'Viewing request accepted' : 'Viewing request rejected',
            body: isAccepted
              ? `Your viewing request for "${request.listing.title}" was accepted.`
              : `Your viewing request for "${request.listing.title}" was rejected.`,
            entityType: `viewing_request.${dto.status}.listing.${request.listingId}`,
            entityId: request.id,
          },
          tx,
        );
      }

      return updatedRequest;
    });
  }

  // ── 6. إلغاء الطلب (Tenant فقط) ──────────────────────────────────────────
  async cancelRequest(requestId: string, tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.viewingRequest.findUnique({
        where: { id: requestId },
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

    if (!request) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا الطلب');
    }

    if (request.status !== RequestStatus.pending) {
      throw new BadRequestException('لا يمكن إلغاء الطلب إلا إذا كان قيد الانتظار');
    }

    await tx.viewingRequest.delete({
      where: { id: requestId },
    });

    await this.notificationService.createUnique(
      {
        userId: request.listing.landlordId,
        type: NotificationType.REQUEST,
        title: 'Viewing request canceled',
        body: `A tenant canceled their viewing request for "${request.listing.title}".`,
        entityType: `viewing_request.canceled.listing.${request.listingId}`,
        entityId: request.id,
      },
      tx,
    );

    return { message: 'تم إلغاء الطلب بنجاح' };
    });
  }

  // ── 7. جلب إحصائيات المؤجر ───────────────────────────────────────────────
  async finalizeBedRental(requestId: string, landlordId: string, dto: FinalizeBedRentalDto) {
    return this.prisma.$transaction(async (tx) => {
      return this.finalizeBedRentalTx(requestId, landlordId, dto, tx);
    });
  }

  async finalizeBedRentalTx(
    requestId: string,
    landlordId: string,
    dto: FinalizeBedRentalDto,
    tx: Prisma.TransactionClient,
  ) {
    const request = await tx.viewingRequest.findUnique({
      where: { id: requestId },
      include: { listing: true },
    });

    if (!request) {
      throw new NotFoundException('Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯');
    }

    if (request.listing.landlordId !== landlordId) {
      throw new ForbiddenException('Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ù„Ø¥ØªÙ…Ø§Ù… ØªØ£Ø¬ÙŠØ± Ù‡Ø°Ø§ Ø§Ù„Ø³Ø±ÙŠØ±');
    }

    if (request.status !== RequestStatus.accepted) {
      throw new BadRequestException('ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø·Ù„Ø¨ Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø© Ù…Ù‚Ø¨ÙˆÙ„Ø§Ù‹ Ù‚Ø¨Ù„ ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø³Ø±ÙŠØ±');
    }

    if (request.listing.unitType !== UnitType.bed) {
      throw new BadRequestException('ÙŠÙ…ÙƒÙ† Ø¥ØªÙ…Ø§Ù… ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø£Ø³Ø±Ø© Ù…Ù† Ø·Ù„Ø¨Ø§Øª Ø¥Ø¹Ù„Ø§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø±Ø© ÙÙ‚Ø·');
    }

    const bed = await tx.listingBed.findUnique({
      where: { id: dto.bedId },
      select: { listingId: true },
    });

    if (!bed) {
      throw new NotFoundException('Ø§Ù„Ø³Ø±ÙŠØ± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯');
    }

    if (bed.listingId !== request.listingId) {
      throw new BadRequestException('Ø§Ù„Ø³Ø±ÙŠØ± Ø§Ù„Ù…Ø­Ø¯Ø¯ Ù„Ø§ ÙŠØªØ¨Ø¹ Ù„Ø¥Ø¹Ù„Ø§Ù† Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨');
    }

    const rentalResult = await this.bedsService.rentBed(
      dto.bedId,
      landlordId,
      {
        tenantId: request.tenantId,
        rentedSince: dto.rentedSince,
        rentedUntil: dto.rentedUntil,
      },
      tx,
    );

    const completedRequest = await tx.viewingRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.completed },
      include: {
        listing: { select: { id: true, title: true, unitType: true } },
        tenant: {
          select: {
            ...userPublicSelect,
            phone: true,
          },
        },
      },
    });

    await this.rentalContractsService.createContract({
      listingId: request.listingId,
      landlordId,
      tenantId: request.tenantId,
      bedId: dto.bedId,
      viewingRequestId: requestId,
      createdByType: request.message === 'direct_rent' ? ContractCreatedBy.MANUAL : ContractCreatedBy.VIEWING_REQUEST,
      monthlyRent: request.listing.price,
      securityDeposit: request.listing.securityDeposit,
      startDate: dto.rentedSince,
      endDate: dto.rentedUntil,
    }, tx);

    await this.notificationService.createUnique(
      {
        userId: request.listing.landlordId,
        type: NotificationType.SYSTEM,
        title: 'Bed rental completed',
        body: `Bed rental for "${request.listing.title}" has been completed.`,
        entityType: 'bed.rental.completed',
        entityId: request.id,
      },
      tx,
    );

    await this.notificationService.createUnique(
      {
        userId: request.tenantId,
        type: NotificationType.SYSTEM,
        title: 'Bed rental completed',
        body: `Your bed rental for "${request.listing.title}" has been completed.`,
        entityType: 'bed.rental.completed',
        entityId: request.id,
      },
      tx,
    );

    // Invalidate/auto-reject other pending requests if no beds remain
    const updatedListing = await tx.listing.findUnique({
      where: { id: request.listingId },
      select: { availableBeds: true },
    });
    const newAvailableBeds = updatedListing?.availableBeds ?? 0;

    if (newAvailableBeds === 0) {
      await tx.viewingRequest.updateMany({
        where: {
          listingId: request.listingId,
          id: { not: requestId },
          status: RequestStatus.pending,
        },
        data: {
          status: RequestStatus.rejected,
        },
      });
    }

    return {
      ...rentalResult,
      request: completedRequest,
    };
  }

  async finalizeUnitRental(requestId: string, landlordId: string, dto: FinalizeUnitRentalDto) {
    return this.prisma.$transaction(async (tx) => {
      return this.finalizeUnitRentalTx(requestId, landlordId, dto, tx);
    });
  }

  async finalizeUnitRentalTx(
    requestId: string,
    landlordId: string,
    dto: FinalizeUnitRentalDto,
    tx: Prisma.TransactionClient,
  ) {
    const request = await tx.viewingRequest.findUnique({
      where: { id: requestId },
      include: { listing: true },
    });

      if (!request) {
        throw new NotFoundException('طلب المعاينة غير موجود');
      }

      if (request.listing.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لإتمام تأجير هذا العقار');
      }

      if (request.status !== RequestStatus.accepted) {
        throw new BadRequestException('يجب أن يكون طلب المعاينة مقبولاً قبل تسجيل عقد الإيجار');
      }

      if (request.listing.unitType === UnitType.bed) {
        throw new BadRequestException('استخدم مسار تأجير الأسرة لإعلانات الأسرة');
      }

      if (request.listing.status === ListingStatus.rented || request.listing.currentTenantId) {
        throw new BadRequestException('هذا العقار مؤجر حالياً');
      }

      if (dto.rentedSince >= dto.rentedUntil) {
        throw new BadRequestException('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      }

      const listing = await tx.listing.update({
        where: { id: request.listingId },
        data: {
          status: ListingStatus.rented,
          currentTenantId: request.tenantId,
          rentedSince: dto.rentedSince,
          rentedUntil: dto.rentedUntil,
        },
        include: {
          currentTenant: {
            select: userPublicSelect,
          },
        },
      });

      const completedRequest = await tx.viewingRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.completed },
        include: {
          listing: { select: { id: true, title: true, unitType: true } },
          tenant: {
            select: {
              ...userPublicSelect,
              phone: true,
            },
          },
        },
      });

      await this.rentalContractsService.createContract({
        listingId: request.listingId,
        landlordId,
        tenantId: request.tenantId,
        viewingRequestId: requestId,
        createdByType: request.message === 'direct_rent' ? ContractCreatedBy.MANUAL : ContractCreatedBy.VIEWING_REQUEST,
        monthlyRent: request.listing.price,
        securityDeposit: request.listing.securityDeposit,
        startDate: dto.rentedSince,
        endDate: dto.rentedUntil,
      }, tx);

      await this.notificationService.createUnique(
        {
          userId: request.listing.landlordId,
          type: NotificationType.SYSTEM,
          title: 'Rental completed',
          body: `Rental for "${request.listing.title}" has been completed.`,
          entityType: 'unit.rental.completed',
          entityId: request.id,
        },
        tx,
      );

      await this.notificationService.createUnique(
        {
          userId: request.tenantId,
          type: NotificationType.SYSTEM,
          title: 'Rental completed',
          body: `Your rental for "${request.listing.title}" has been completed.`,
          entityType: 'unit.rental.completed',
          entityId: request.id,
        },
        tx,
      );

    // Reject all other pending requests for this listing
    await tx.viewingRequest.updateMany({
      where: {
        listingId: request.listingId,
        id: { not: requestId },
        status: RequestStatus.pending,
      },
      data: {
        status: RequestStatus.rejected,
      },
    });

    return {
      message: 'تم تسجيل عقد الإيجار بنجاح',
      listing,
      request: completedRequest,
    };
  }

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
