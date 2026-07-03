// apps/backend/src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingStatus, RequestStatus, BedStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandlordStats(landlordId: string) {
    // 1. Active Listings count
    const activeListings = await this.prisma.listing.count({
      where: {
        landlordId,
        status: ListingStatus.active,
      },
    });

    // 2. Occupied Units (rented apartments + rented beds)
    const rentedApartmentsCount = await this.prisma.listing.count({
      where: {
        landlordId,
        status: ListingStatus.rented,
      },
    });

    const rentedBedsCount = await this.prisma.listingBed.count({
      where: {
        status: BedStatus.rented,
        listing: {
          landlordId,
        },
      },
    });

    const occupiedUnits = rentedApartmentsCount + rentedBedsCount;

    // 3. Pending requests for landlord's listings
    const pendingRequests = await this.prisma.viewingRequest.count({
      where: {
        listing: {
          landlordId,
        },
        status: RequestStatus.pending,
      },
    });

    // 4. Monthly Revenue (sum of rented listings + sum of listing prices of rented beds)
    const rentedApartmentsSum = await this.prisma.listing.aggregate({
      _sum: {
        price: true,
      },
      where: {
        landlordId,
        status: ListingStatus.rented,
      },
    });

    const rentedBeds = await this.prisma.listingBed.findMany({
      where: {
        status: BedStatus.rented,
        listing: {
          landlordId,
        },
      },
      select: {
        listing: {
          select: {
            price: true,
          },
        },
      },
    });

    const rentedBedsSumPrice = rentedBeds.reduce((sum, item) => sum + (item.listing?.price || 0), 0);
    const monthlyRevenue = (rentedApartmentsSum._sum.price || 0) + rentedBedsSumPrice;

    // 5. Total Views across all landlord listings
    const viewsAggregate = await this.prisma.listing.aggregate({
      _sum: {
        viewCount: true,
      },
      where: {
        landlordId,
      },
    });
    const totalViews = viewsAggregate._sum.viewCount ?? 0;

    return {
      activeListings,
      occupiedUnits,
      pendingRequests,
      monthlyRevenue,
      totalViews,
    };
  }

  async getTenantStats(tenantId: string) {
    // 1. Active Requests (pending, accepted, approved)
    const activeRequests = await this.prisma.viewingRequest.count({
      where: {
        tenantId,
        status: {
          in: [RequestStatus.pending, RequestStatus.accepted],
        },
      },
    });

    // 2. Active Alerts count
    const activeAlerts = await this.prisma.alert.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    // 3. Rented Units count (completed viewing requests)
    const rentedUnits = await this.prisma.viewingRequest.count({
      where: {
        tenantId,
        status: RequestStatus.completed,
      },
    });

    // 4. Monthly Rent (sum of listing prices of completed viewing requests)
    const completedRequests = await this.prisma.viewingRequest.findMany({
      where: {
        tenantId,
        status: RequestStatus.completed,
      },
      select: {
        listing: {
          select: {
            price: true,
          },
        },
      },
    });

    const monthlyRent = completedRequests.reduce((sum, item) => sum + (item.listing?.price || 0), 0);

    return {
      activeRequests,
      activeAlerts,
      rentedUnits,
      monthlyRent,
    };
  }
}
