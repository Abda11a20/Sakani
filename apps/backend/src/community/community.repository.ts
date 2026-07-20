// apps/backend/src/community/community.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunityPostStatus,
  CommunityParticipantStatus,
  GenderPreference,
  ReportReason,
  ReportStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.communityCategory.findMany({
      orderBy: { nameAr: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.communityCategory.findUnique({
      where: { id },
    });
  }

  async createPost(data: Prisma.CommunityPostUncheckedCreateInput) {
    return this.prisma.communityPost.create({
      data,
      include: {
        category: true,
        user: true,
      },
    });
  }

  async findPostById(id: string) {
    return this.prisma.communityPost.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            communityRatingAvg: true,
            communityReviewsCount: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                communityRatingAvg: true,
              },
            },
          },
        },
        reports: true,
      },
    });
  }

  async countActivePostsByUser(userId: string) {
    return this.prisma.communityPost.count({
      where: {
        userId,
        status: CommunityPostStatus.ACTIVE,
        isDeleted: false,
      },
    });
  }

  async findPosts(params: {
    categoryId?: string;
    governorateId?: string;
    cityId?: string;
    genderPreference?: GenderPreference;
    search?: string;
    date?: string;
    status?: CommunityPostStatus;
    skip: number;
    take: number;
  }) {
    const where: Prisma.CommunityPostWhereInput = {
      isDeleted: false,
    };

    if (params.status) {
      where.status = params.status;
    } else {
      where.status = CommunityPostStatus.ACTIVE;
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.governorateId) {
      where.governorateId = params.governorateId;
    }

    if (params.cityId) {
      where.cityId = params.cityId;
    }

    if (params.genderPreference) {
      where.genderPreference = params.genderPreference;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.eventDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const posts = await this.prisma.communityPost.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            communityRatingAvg: true,
            communityReviewsCount: true,
          },
        },
        participants: {
          where: { status: CommunityParticipantStatus.ACCEPTED },
        },
      },
    });

    const total = await this.prisma.communityPost.count({ where });

    return { posts, total };
  }

  async updatePost(id: string, data: Prisma.CommunityPostUncheckedUpdateInput) {
    return this.prisma.communityPost.update({
      where: { id },
      data,
    });
  }

  async findParticipant(postId: string, userId: string) {
    return this.prisma.communityParticipant.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });
  }

  async findParticipantById(id: string) {
    return this.prisma.communityParticipant.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });
  }

  async createParticipant(postId: string, userId: string) {
    return this.prisma.communityParticipant.create({
      data: {
        postId,
        userId,
        status: CommunityParticipantStatus.PENDING,
      },
    });
  }

  async updateParticipantStatus(
    id: string,
    status: CommunityParticipantStatus,
  ) {
    return this.prisma.communityParticipant.update({
      where: { id },
      data: { status },
      include: {
        post: true,
      },
    });
  }

  async createReport(data: {
    postId: string;
    reporterId: string;
    reason: ReportReason;
    details?: string;
  }) {
    return this.prisma.communityReport.create({
      data,
    });
  }

  async findReports(skip: number, take: number) {
    const where: Prisma.CommunityReportWhereInput = {};

    const reports = await this.prisma.communityReport.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        post: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    const total = await this.prisma.communityReport.count({ where });
    return { reports, total };
  }

  async updateReportStatus(id: string, status: ReportStatus) {
    return this.prisma.communityReport.update({
      where: { id },
      data: { status },
    });
  }

  async createReview(data: {
    postId: string;
    authorId: string;
    targetId: string;
    rating: number;
  }) {
    return this.prisma.communityReview.create({
      data,
    });
  }

  async hasUserReviewedPost(postId: string, authorId: string) {
    const review = await this.prisma.communityReview.findUnique({
      where: {
        postId_authorId: { postId, authorId },
      },
    });
    return !!review;
  }

  async calculateUserAverageRating(userId: string) {
    const aggregate = await this.prisma.communityReview.aggregate({
      where: { targetId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.rating || 0,
    };
  }

  async createAlert(data: {
    userId: string;
    categoryId: string;
    governorateId: string;
    cityId: string;
    genderPreference?: GenderPreference;
  }) {
    return this.prisma.communityAlert.create({
      data,
    });
  }

  async getAlertsForUser(userId: string) {
    return this.prisma.communityAlert.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlertStatus(id: string, userId: string, isActive: boolean) {
    return this.prisma.communityAlert.updateMany({
      where: { id, userId },
      data: { isActive },
    });
  }

  async findMatchingAlerts(params: {
    categoryId: string;
    governorateId: string;
    cityId: string;
    genderPreference: GenderPreference;
  }) {
    return this.prisma.communityAlert.findMany({
      where: {
        categoryId: params.categoryId,
        governorateId: params.governorateId,
        cityId: params.cityId,
        isActive: true,
        OR: [
          { genderPreference: params.genderPreference },
          { genderPreference: GenderPreference.ALL },
        ],
      },
      select: {
        userId: true,
      },
    });
  }

  async getExpiredPendingParticipants() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.communityParticipant.findMany({
      where: {
        status: CommunityParticipantStatus.PENDING,
        createdAt: { lt: sevenDaysAgo },
      },
    });
  }

  async getActivePastPosts() {
    return this.prisma.communityPost.findMany({
      where: {
        status: CommunityPostStatus.ACTIVE,
        eventDate: { lt: new Date() },
        isDeleted: false,
      },
    });
  }
}
