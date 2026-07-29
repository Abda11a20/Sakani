// apps/backend/src/dashboard/providers/quick-actions.provider.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, RequestStatus, ContractStatus, UserRole } from '@prisma/client';

export type QuickActionKey =
  | 'CREATE_FIRST_LISTING'
  | 'CREATE_NEW_LISTING'
  | 'REVIEW_PENDING_REQUESTS'
  | 'RENEW_EXPIRING_CONTRACT'
  | 'SEARCH_HOUSING'
  | 'CREATE_SMART_ALERT'
  | 'CONFIRM_VIEWING_APPOINTMENT'
  | 'MODERATE_PENDING_LISTINGS'
  | 'REVIEW_REPORTED_USERS';

@Injectable()
export class DashboardQuickActionsProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getQuickActions(userId: string, role: string): Promise<QuickActionKey[]> {
    if (role === UserRole.landlord) {
      return this.getLandlordActions(userId);
    } else if (role === UserRole.tenant) {
      return this.getTenantActions(userId);
    } else if (role === UserRole.admin || role === UserRole.super_admin) {
      return this.getAdminActions();
    }
    return [];
  }

  private async getLandlordActions(landlordId: string): Promise<QuickActionKey[]> {
    const actions: QuickActionKey[] = [];

    const listingsCount = await this.prisma.listing.count({ where: { landlordId } });
    if (listingsCount === 0) {
      actions.push('CREATE_FIRST_LISTING');
    } else {
      actions.push('CREATE_NEW_LISTING');
    }

    const pendingRequestsCount = await this.prisma.viewingRequest.count({
      where: { listing: { landlordId }, status: RequestStatus.pending },
    });
    if (pendingRequestsCount > 0) {
      actions.push('REVIEW_PENDING_REQUESTS');
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringCount = await this.prisma.rentalContract.count({
      where: { landlordId, status: ContractStatus.active, endDate: { lte: sevenDaysFromNow } },
    });
    if (expiringCount > 0) {
      actions.push('RENEW_EXPIRING_CONTRACT');
    }

    return actions;
  }

  private async getTenantActions(tenantId: string): Promise<QuickActionKey[]> {
    const actions: QuickActionKey[] = ['SEARCH_HOUSING'];

    const acceptedCount = await this.prisma.viewingRequest.count({
      where: { tenantId, status: RequestStatus.accepted },
    });
    if (acceptedCount > 0) {
      actions.push('CONFIRM_VIEWING_APPOINTMENT');
    }

    const alertsCount = await this.prisma.alert.count({ where: { tenantId, isActive: true } });
    if (alertsCount === 0) {
      actions.push('CREATE_SMART_ALERT');
    }

    return actions;
  }

  private async getAdminActions(): Promise<QuickActionKey[]> {
    const actions: QuickActionKey[] = [];

    const pendingListings = await this.prisma.listing.count({ where: { status: ListingStatus.pending_review } });
    if (pendingListings > 0) {
      actions.push('MODERATE_PENDING_LISTINGS');
    }

    actions.push('REVIEW_REPORTED_USERS');
    return actions;
  }
}
