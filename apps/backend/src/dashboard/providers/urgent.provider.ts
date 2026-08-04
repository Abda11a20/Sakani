// apps/backend/src/dashboard/providers/urgent.provider.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContractStatus,
  RequestStatus,
  ListingStatus,
  UserRole,
} from '@prisma/client';

export interface UrgentItem {
  id: string;
  type:
    | 'CONTRACT_EXPIRING'
    | 'VIEWING_REQUEST_PENDING'
    | 'LISTING_UNAPPROVED'
    | 'LISTING_PAUSED'
    | 'REQUEST_ACCEPTED';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'info';
  entityId?: string;
  route?: string;
}

@Injectable()
export class DashboardUrgentProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getUrgentItems(userId: string, role: string): Promise<UrgentItem[]> {
    if (role === UserRole.landlord) {
      return this.getLandlordUrgent(userId);
    } else if (role === UserRole.tenant) {
      return this.getTenantUrgent(userId);
    } else if (role === UserRole.admin || role === UserRole.super_admin) {
      return this.getAdminUrgent();
    }
    return [];
  }

  private async getLandlordUrgent(landlordId: string): Promise<UrgentItem[]> {
    const items: UrgentItem[] = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Expiring Contracts within 7 days
    const expiringContracts = await this.prisma.rentalContract.findMany({
      where: {
        landlordId,
        status: ContractStatus.active,
        endDate: { lte: sevenDaysFromNow },
      },
      include: { listing: { select: { title: true } } },
      take: 3,
    });

    expiringContracts.forEach((c) => {
      items.push({
        id: `exp-${c.id}`,
        type: 'CONTRACT_EXPIRING',
        title: 'عقد إيجار موشك على الانتهاء',
        description: `العقد رقم ${c.contractNumber} للوحدة "${c.listing?.title || ''}" ينتهي في ${new Date(c.endDate).toLocaleDateString('ar-EG')}.`,
        severity: 'high',
        entityId: c.id,
        route: '/dashboard/landlord/rental-history',
      });
    });

    // 2. Pending Viewing Requests
    const pendingRequests = await this.prisma.viewingRequest.findMany({
      where: { listing: { landlordId }, status: RequestStatus.pending },
      include: {
        tenant: { select: { name: true } },
        listing: { select: { title: true } },
      },
      take: 3,
    });

    pendingRequests.forEach((req) => {
      items.push({
        id: `req-${req.id}`,
        type: 'VIEWING_REQUEST_PENDING',
        title: 'طلب معاينة جديد بانتظار الرد',
        description: `قدم ${req.tenant?.name || 'مستأجر'} طلب معاينة للعقار "${req.listing?.title || ''}".`,
        severity: 'medium',
        entityId: req.id,
        route: '/dashboard/landlord/requests',
      });
    });

    return items;
  }

  private async getTenantUrgent(tenantId: string): Promise<UrgentItem[]> {
    const items: UrgentItem[] = [];

    // Accepted Viewing Requests awaiting confirmation
    const acceptedRequests = await this.prisma.viewingRequest.findMany({
      where: { tenantId, status: RequestStatus.accepted },
      include: { listing: { select: { title: true } } },
      take: 3,
    });

    acceptedRequests.forEach((req) => {
      items.push({
        id: `acc-${req.id}`,
        type: 'REQUEST_ACCEPTED',
        title: 'تم قبول طلب المعاينة الخاص بك',
        description: `وافق المالك على معاينة العقار "${req.listing?.title || ''}". تواصل معه لتأكيد الموعد النهائي.`,
        severity: 'info',
        entityId: req.id,
        route: '/dashboard/tenant/viewing-requests',
      });
    });

    return items;
  }

  private async getAdminUrgent(): Promise<UrgentItem[]> {
    const items: UrgentItem[] = [];

    const pendingListingsCount = await this.prisma.listing.count({
      where: { status: ListingStatus.pending_review },
    });

    if (pendingListingsCount > 0) {
      items.push({
        id: 'admin-pending-listings',
        type: 'LISTING_UNAPPROVED',
        title: 'إعلانات جديدة تنتظر المراجعة',
        description: `يوجد ${pendingListingsCount} إعلان بانتظار المراجعة والاعتماد للنشر.`,
        severity: 'high',
        route: '/admin/listings',
      });
    }

    return items;
  }
}
