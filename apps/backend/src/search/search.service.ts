// apps/backend/src/search/search.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ListingStatus, Prisma, UnitType } from '@prisma/client';
import { userPublicSelect } from '../common/selects/user.select';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
    const {
      page = 1,
      limit = 12,
      q,
      unitType,
      governorate,
      district,
      minPrice,
      maxPrice,
      genderTarget,
      amenities,
      verifiedOnly,
      specialty,
      sortBy = 'newest',
    } = query;

    const actualLimit = Math.min(limit, 50);
    const skip = (page - 1) * actualLimit;

    // ── Build where clause ─────────────────────────────────────────────────────
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
      unitType: { in: [UnitType.apartment, UnitType.bed] },
      isDeleted: false,
    };

    // Full-text search across multiple fields
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { governorate: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (unitType) {
      where.unitType =
        unitType === UnitType.room ? { in: [] } : unitType;
    }

    if (governorate) {
      where.governorate = { contains: governorate, mode: 'insensitive' };
    }

    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) (where.price as Prisma.IntFilter).gte = minPrice;
      if (maxPrice !== undefined) (where.price as Prisma.IntFilter).lte = maxPrice;
    }

    if (genderTarget) where.genderTarget = genderTarget;

    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        where.amenities = { hasEvery: amenityList };
      }
    }

    if (verifiedOnly === true) {
      where.landlord = { emailVerifiedAt: { not: null } };
    }

    if (specialty) {
      where.roommateFeatureEnabled = true;
    }

    // ── Build orderBy ──────────────────────────────────────────────────────────
    let orderBy: Prisma.ListingOrderByWithRelationInput;
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // ── Execute queries ────────────────────────────────────────────────────────
    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: actualLimit,
        orderBy,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          landlord: {
            select: {
              ...userPublicSelect,
              ratingAvg: true,
              phone: true,
              _count: {
                select: { listings: true },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Filter out bed-specific fields for non-bed unit types
    const formattedData = data.map((listing) => {
      if (listing.unitType !== UnitType.bed) {
        const { availableBeds: _ab, totalBeds: _tb, ...rest } = listing;
        return rest;
      }
      return listing;
    });

    return {
      data: formattedData,
      total,
      page,
      limit: actualLimit,
      totalPages: Math.ceil(total / actualLimit),
    };
  }

  async getPopularDistricts() {
    const results = await this.prisma.listing.groupBy({
      by: ['district', 'governorate'],
      where: { status: ListingStatus.active, isDeleted: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return results.map((r) => ({
      district: r.district,
      governorate: r.governorate,
      count: r._count.id,
    }));
  }

  async getSuggestedListings(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { district: true, unitType: true },
    });

    if (!listing) return [];

    return this.prisma.listing.findMany({
      where: {
        id: { not: listingId },
        district: listing.district,
        unitType: listing.unitType,
        status: ListingStatus.active,
        isDeleted: false,
      },
      take: 4,
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        landlord: {
          select: {
            ...userPublicSelect,
            ratingAvg: true,
            phone: true,
            _count: {
              select: { listings: true },
            },
          },
        },
      },
    });
  }

  async getPriceStats(governorate?: string, district?: string) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
      isDeleted: false,
    };

    if (governorate) {
      where.governorate = { contains: governorate, mode: 'insensitive' };
    }
    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    const stats = await this.prisma.listing.aggregate({
      where,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { id: true },
    });

    return {
      avgPrice: stats._avg.price,
      minPrice: stats._min.price,
      maxPrice: stats._max.price,
      totalListings: stats._count.id,
    };
  }
}
