// apps/backend/src/dashboard/providers/stats.provider.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ListingStatus,
  RequestStatus,
  BedStatus,
  ContractStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class DashboardStatsProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, role: string) {
    if (role === UserRole.landlord) {
      return this.getLandlordStats(userId);
    } else if (role === UserRole.tenant) {
      return this.getTenantStats(userId);
    } else if (role === UserRole.admin || role === UserRole.super_admin) {
      return this.getAdminStats();
    }
    return {};
  }

  private async getLandlordStats(landlordId: string) {
    const [
      activeListings,
      occupiedApartments,
      rentedBeds,
      pendingRequests,
      activeContracts,
      totalViewsAgg,
    ] = await Promise.all([
      this.prisma.listing.count({
        where: { landlordId, status: ListingStatus.active, isDeleted: false },
      }),
      this.prisma.listing.count({
        where: { landlordId, status: ListingStatus.rented, isDeleted: false },
      }),
      this.prisma.listingBed.count({
        where: { status: BedStatus.rented, listing: { landlordId } },
      }),
      this.prisma.viewingRequest.count({
        where: { listing: { landlordId }, status: RequestStatus.pending },
      }),
      this.prisma.rentalContract.count({
        where: { landlordId, status: ContractStatus.active },
      }),
      this.prisma.listing.aggregate({
        _sum: { viewCount: true },
        where: { landlordId, isDeleted: false },
      }),
    ]);

    return {
      activeListings,
      occupiedUnits: occupiedApartments + rentedBeds,
      pendingRequests,
      activeContracts,
      totalViews: totalViewsAgg._sum.viewCount ?? 0,
    };
  }

  private async getTenantStats(tenantId: string) {
    const [activeRequests, activeAlerts, activeContracts, completedRentals] =
      await Promise.all([
        this.prisma.viewingRequest.count({
          where: {
            tenantId,
            status: { in: [RequestStatus.pending, RequestStatus.accepted] },
          },
        }),
        this.prisma.alert.count({ where: { tenantId, isActive: true } }),
        this.prisma.rentalContract.count({
          where: { tenantId, status: ContractStatus.active },
        }),
        this.prisma.viewingRequest.count({
          where: { tenantId, status: RequestStatus.completed },
        }),
      ]);

    return {
      activeRequests,
      activeAlerts,
      activeContracts,
      completedRentals,
    };
  }

  private async getAdminStats() {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      tenantsCount,
      landlordsCount,
      adminsCount,
      superAdminsCount,
      totalListings,
      activeListings,
      pendingListings,
      pausedListings,
      deletedListings,
      activeContracts,
      expiredContracts,
      totalViewingRequests,
      pendingViewingRequests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.blacklist.count(),
      this.prisma.user.count({ where: { role: UserRole.tenant } }),
      this.prisma.user.count({ where: { role: UserRole.landlord } }),
      this.prisma.user.count({ where: { role: UserRole.admin } }),
      this.prisma.user.count({ where: { role: UserRole.super_admin } }),
      this.prisma.listing.count({ where: { isDeleted: false } }),
      this.prisma.listing.count({
        where: { status: ListingStatus.active, isDeleted: false },
      }),
      this.prisma.listing.count({
        where: { status: ListingStatus.pending_review, isDeleted: false },
      }),
      this.prisma.listing.count({
        where: { status: ListingStatus.paused, isDeleted: false },
      }),
      this.prisma.listing.count({ where: { isDeleted: true } }),
      this.prisma.rentalContract.count({
        where: { status: ContractStatus.active },
      }),
      this.prisma.rentalContract.count({
        where: { status: ContractStatus.expired },
      }),
      this.prisma.viewingRequest.count(),
      this.prisma.viewingRequest.count({
        where: { status: RequestStatus.pending },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      tenantsCount,
      landlordsCount,
      adminsCount,
      superAdminsCount,
      totalListings,
      activeListings,
      pendingListings,
      pendingListingsCount: pendingListings,
      pausedListings,
      deletedListings,
      activeContracts,
      expiredContracts,
      totalViewingRequests,
      pendingViewingRequests,
      pendingReportsCount: 0,
    };
  }
}
