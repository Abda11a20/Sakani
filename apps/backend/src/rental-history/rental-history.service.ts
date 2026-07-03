// apps/backend/src/rental-history/rental-history.service.ts
//
// Data source: ViewingRequest WHERE status = 'completed'
// joined with Listing + User.
//
// NOTE: ViewingRequest is the primary source for rental history in the
// current implementation. As the system evolves (contract termination,
// renewal, multiple tenants per listing over time), a dedicated
// RentalContract model should be introduced and this service updated.
//
// Sorting uses `updatedAt` (the timestamp of the last status change,
// i.e. when the request was marked `completed`).
// Until a dedicated `completedAt` field exists, `updatedAt` is the
// closest proxy for "when the rental was finalized".

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, Prisma } from '@prisma/client';
import { userPublicSelect } from '../common/selects/user.select';

export interface RentalHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
}

@Injectable()
export class RentalHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Landlord Rental History ──────────────────────────────────────────────────
  async getLandlordHistory(landlordId: string, query: RentalHistoryQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      from,
      to,
      sort = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ViewingRequestWhereInput = {
      status: RequestStatus.completed,
      listing: {
        landlordId,
      },
    };

    // Date range filter (on updatedAt — the finalization timestamp)
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.updatedAt.lte = toDate;
      }
    }

    // Search filter on listing title OR tenant name
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        {
          listing: {
            landlordId,
            title: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          tenant: {
            name: { contains: searchTerm, mode: 'insensitive' },
          },
          listing: { landlordId },
        },
      ];
      // Remove the top-level listing filter to avoid conflict with OR
      delete where.listing;
    }

    const [data, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: sort },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true, // used as completedAt proxy
          listing: {
            select: {
              id: true,
              title: true,
              unitType: true,
              price: true,
              governorate: true,
              district: true,
              images: {
                select: { url: true },
                orderBy: { order: 'asc' },
                take: 1,
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
      }),
      this.prisma.viewingRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // ── Tenant Rental History ────────────────────────────────────────────────────
  async getTenantHistory(tenantId: string, query: RentalHistoryQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      from,
      to,
      sort = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ViewingRequestWhereInput = {
      status: RequestStatus.completed,
      tenantId,
    };

    // Date range filter
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.updatedAt.lte = toDate;
      }
    }

    // Search filter on listing title OR landlord name
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        {
          listing: {
            title: { contains: searchTerm, mode: 'insensitive' },
          },
          tenantId,
        },
        {
          listing: {
            landlord: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
          tenantId,
        },
      ];
      delete where.tenantId;
    }

    const [data, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: sort },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true, // completedAt proxy
          listing: {
            select: {
              id: true,
              title: true,
              unitType: true,
              price: true,
              governorate: true,
              district: true,
              images: {
                select: { url: true },
                orderBy: { order: 'asc' },
                take: 1,
              },
              landlord: {
                select: {
                  ...userPublicSelect,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.viewingRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // ── Admin Rental History (All Completed Rentals) ──────────────────────────────
  async getAdminHistory(query: RentalHistoryQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      from,
      to,
      sort = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ViewingRequestWhereInput = {
      status: RequestStatus.completed,
    };

    // Date range filter
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.updatedAt.lte = toDate;
      }
    }

    // Search filter on listing title OR tenant name OR landlord name
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        {
          listing: {
            title: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          tenant: {
            name: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          listing: {
            landlord: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.viewingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: sort },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true, // completedAt proxy
          listing: {
            select: {
              id: true,
              title: true,
              unitType: true,
              price: true,
              governorate: true,
              district: true,
              images: {
                select: { url: true },
                orderBy: { order: 'asc' },
                take: 1,
              },
              landlord: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatarUrl: true,
                  email: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.viewingRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}

