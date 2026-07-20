// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\reviews\reviews.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotificationType, RequestStatus, UserRole } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(tenantId: string, dto: CreateReviewDto) {
    // 1. Verify tenant has a request in "completed" state for this listing
    const completedRequest = await this.prisma.viewingRequest.findFirst({
      where: {
        tenantId,
        listingId: dto.listingId,
        status: RequestStatus.completed,
      },
    });

    if (!completedRequest) {
      throw new ForbiddenException('يجب إتمام الإقامة أولاً قبل التقييم');
    }

    // 2. Verify tenant hasn't reviewed this listing before
    const existingReview = await this.prisma.review.findFirst({
      where: {
        tenantId,
        listingId: dto.listingId,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('لقد قمت بتقييم هذا الإعلان من قبل');
    }

    // Get landlordId from the listing
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, title: true, landlordId: true },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          tenantId,
          landlordId: listing.landlordId,
          listingId: dto.listingId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      const allReviews = await tx.review.aggregate({
        where: { landlordId: listing.landlordId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const averageRating = allReviews._avg.rating || 0;
      const totalReviews = allReviews._count.rating || 0;

      await tx.user.update({
        where: { id: listing.landlordId },
        data: {
          ratingAvg: averageRating,
          reviewsCount: totalReviews,
        },
      });

      await this.notificationService.createUnique(
        {
          userId: listing.landlordId,
          type: NotificationType.REVIEW,
          title: 'New review',
          body: `You received a new review on "${listing.title}".`,
          entityType: 'review.created',
          entityId: createdReview.id,
        },
        tx,
      );

      return createdReview;
    });

    return review;
  }

  async getListingReviews(
    listingId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { listingId },
        include: {
          tenant: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { listingId } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyReviews(tenantId: string) {
    return this.prisma.review.findMany({
      where: { tenantId },
      include: {
        listing: {
          select: { id: true, title: true, unitType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLandlordReviews(
    landlordId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { landlordId },
        include: {
          listing: {
            select: { id: true, title: true, unitType: true },
          },
          tenant: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { landlordId } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLandlordRating(landlordId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { landlordId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = aggregate._avg.rating || 0;
    const totalReviews = aggregate._count.id || 0;

    const groupedRatings = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { landlordId },
      _count: {
        rating: true,
      },
    });

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    groupedRatings.forEach((group) => {
      distribution[group.rating] = group._count.rating;
    });

    return {
      averageRating,
      totalReviews,
      distribution,
    };
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    const isAdmin =
      userRole === UserRole.admin || userRole === UserRole.super_admin;
    const isOwner = userRole === UserRole.tenant && review.tenantId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا التقييم');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Update landlord ratings after deletion
    const allReviews = await this.prisma.review.aggregate({
      where: { landlordId: review.landlordId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = allReviews._avg.rating || 0;
    const totalReviews = allReviews._count.rating || 0;

    await this.prisma.user.update({
      where: { id: review.landlordId },
      data: {
        ratingAvg: averageRating,
        reviewsCount: totalReviews,
      },
    });

    return { success: true, message: 'تم حذف التقييم بنجاح' };
  }
}
