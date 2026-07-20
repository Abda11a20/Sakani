// apps/backend/src/community/community.service.ts

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommunityRepository } from './community.repository';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadWordsFilter } from '../common/utils/bad-words.filter';
import {
  CommunityPostStatus,
  CommunityParticipantStatus,
  GenderPreference,
  ReportReason,
  ReportStatus,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(
    private readonly repo: CommunityRepository,
    private readonly dispatcher: NotificationDispatcher,
    private readonly prisma: PrismaService,
  ) {}

  async getCategories() {
    return this.repo.getCategories();
  }

  async createPost(
    userId: string,
    dto: {
      title: string;
      description: string;
      categoryId: string;
      governorateId: string;
      cityId: string;
      genderPreference: GenderPreference;
      maxParticipants: number;
      eventDate: string;
      timeSlot: string;
    },
  ) {
    // 1. Anti-spam: Check active posts limit (Max 5 active posts)
    const activeCount = await this.repo.countActivePostsByUser(userId);
    if (activeCount >= 5) {
      throw new BadRequestException(
        'لقد تجاوزت الحد الأقصى للأنشطة النشطة المسموح بإنشائها حالياً (الحد الأقصى 5 أنشطة).',
      );
    }

    // 2. Bad words filtering validation
    BadWordsFilter.validate(dto.title, 'العنوان');
    BadWordsFilter.validate(dto.description, 'الوصف');

    // Validate category exists
    const category = await this.repo.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('التصنيف المختار غير موجود.');
    }

    // Validate eventDate is in the future
    if (new Date(dto.eventDate) < new Date()) {
      throw new BadRequestException(
        'تاريخ الفعالية لا يمكن أن يكون في الماضي.',
      );
    }

    const post = await this.repo.createPost({
      userId,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      governorateId: dto.governorateId,
      cityId: dto.cityId,
      genderPreference: dto.genderPreference,
      maxParticipants: dto.maxParticipants,
      eventDate: new Date(dto.eventDate),
      timeSlot: dto.timeSlot,
    });

    // 3. Smart alerts matching & notifications dispatching asynchronously
    this.matchAndDispatchAlerts(post);

    return post;
  }

  async getPosts(filters: {
    categoryId?: string;
    governorateId?: string;
    cityId?: string;
    genderPreference?: GenderPreference;
    search?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    return this.repo.findPosts({
      ...filters,
      skip,
      take: limit,
    });
  }

  async getPostDetails(postId: string) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط المطلوب غير موجود أو تم حذفه.');
    }
    return post;
  }

  async cancelPost(postId: string, userId: string) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط غير موجود.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لإلغاء هذا النشاط.');
    }

    return this.repo.updatePost(postId, {
      status: CommunityPostStatus.CANCELLED,
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط غير موجود.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا النشاط.');
    }

    // Soft delete to protect reporting history integrity
    return this.repo.updatePost(postId, { isDeleted: true });
  }

  async requestJoin(postId: string, userId: string) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط غير موجود.');
    }

    if (post.userId === userId) {
      throw new BadRequestException(
        'لا يمكنك طلب الانضمام إلى نشاط قمت بإنشائه.',
      );
    }

    if (post.status !== CommunityPostStatus.ACTIVE) {
      throw new BadRequestException(
        'لا يمكن الانضمام إلى نشاط غير نشط أو تم إلغاؤه.',
      );
    }

    const existing = await this.repo.findParticipant(postId, userId);
    if (existing) {
      if (existing.status === CommunityParticipantStatus.PENDING) {
        throw new BadRequestException(
          'لقد قمت بطلب الانضمام بالفعل، الطلب قيد الانتظار.',
        );
      }
      if (existing.status === CommunityParticipantStatus.ACCEPTED) {
        throw new BadRequestException('لقد تم قبولك في هذا النشاط بالفعل.');
      }
      // If previously rejected or left, allow requesting again
    }

    // Calculate current accepted participants count
    const acceptedCount = post.participants.filter(
      (p) => p.status === CommunityParticipantStatus.ACCEPTED,
    ).length;

    if (acceptedCount >= post.maxParticipants) {
      throw new BadRequestException('عذراً، هذا النشاط مكتمل العدد حالياً.');
    }

    let participant;
    if (existing) {
      participant = await this.repo.updateParticipantStatus(
        existing.id,
        CommunityParticipantStatus.PENDING,
      );
    } else {
      participant = await this.repo.createParticipant(postId, userId);
    }

    // Send notifications to host
    this.notifyHostOfJoinRequest(post, userId);

    return participant;
  }

  async respondToJoinRequest(
    participantId: string,
    hostId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const participant = await this.repo.findParticipantById(participantId);
    if (!participant) {
      throw new NotFoundException('طلب الانضمام غير موجود.');
    }

    if (participant.post.userId !== hostId) {
      throw new ForbiddenException('ليس لديك صلاحية لإدارة طلبات هذا النشاط.');
    }

    if (status === 'ACCEPTED') {
      const post = await this.repo.findPostById(participant.postId);
      const acceptedCount = post!.participants.filter(
        (p) => p.status === CommunityParticipantStatus.ACCEPTED,
      ).length;

      if (acceptedCount >= post!.maxParticipants) {
        throw new BadRequestException(
          'عذراً، لا يمكن قبول المزيد؛ تم اكتمال العدد الأقصى للنشاط.',
        );
      }
    }

    const updated = await this.repo.updateParticipantStatus(
      participantId,
      status === 'ACCEPTED'
        ? CommunityParticipantStatus.ACCEPTED
        : CommunityParticipantStatus.REJECTED,
    );

    // Send push notification to requester
    this.notifyUserOfRequestResponse(updated, status);

    return updated;
  }

  async leaveActivity(postId: string, userId: string) {
    const participant = await this.repo.findParticipant(postId, userId);
    if (
      !participant ||
      participant.status !== CommunityParticipantStatus.ACCEPTED
    ) {
      throw new BadRequestException('أنت لست مشتركاً مقبولاً في هذا النشاط.');
    }

    return this.repo.updateParticipantStatus(
      participant.id,
      CommunityParticipantStatus.LEFT,
    );
  }

  async reportPost(
    reporterId: string,
    postId: string,
    reason: ReportReason,
    details?: string,
  ) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط المطلوب الإبلاغ عنه غير موجود.');
    }

    if (reason === ReportReason.OTHER && !details?.trim()) {
      throw new BadRequestException(
        'يرجى كتابة تفاصيل البلاغ عند اختيار سبب "أخرى".',
      );
    }

    // Sanitize and check bad words in report details
    if (details) {
      BadWordsFilter.validate(details, 'تفاصيل البلاغ');
    }

    return this.repo.createReport({
      postId,
      reporterId,
      reason,
      details,
    });
  }

  async rateHost(postId: string, authorId: string, rating: number) {
    // Constraint 2: Enforce range validation
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5 نجوم فقط.');
    }

    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط غير موجود.');
    }

    // Constraint 1: Target host cannot be themselves
    const targetId = post.userId;
    if (targetId === authorId) {
      throw new BadRequestException('لا يمكنك تقييم نفسك.');
    }

    // Constraint 1: Activity must be archived or finished
    const isFinished =
      post.status === CommunityPostStatus.ARCHIVED ||
      post.eventDate <= new Date();
    if (!isFinished) {
      throw new BadRequestException(
        'لا يمكنك تقديم تقييم للمضيف إلا بعد انتهاء تاريخ النشاط أو أرشفتة.',
      );
    }

    // Constraint 1: Author must be an accepted participant
    const participant = post.participants.find(
      (p) =>
        p.userId === authorId &&
        p.status === CommunityParticipantStatus.ACCEPTED,
    );
    if (!participant) {
      throw new BadRequestException(
        'التقييم متاح فقط للأعضاء المقبولين الذين شاركوا بالفعل بالفعالية.',
      );
    }

    // Constraint 1: One review allowed per user/post (enforced in DB but check here)
    const alreadyReviewed = await this.repo.hasUserReviewedPost(
      postId,
      authorId,
    );
    if (alreadyReviewed) {
      throw new BadRequestException(
        'لقد قمت بتقييم المضيف عن هذا النشاط مسبقاً.',
      );
    }

    const review = await this.repo.createReview({
      postId,
      authorId,
      targetId,
      rating,
    });

    // Recalculate average rating of host
    const stats = await this.repo.calculateUserAverageRating(targetId);
    await this.prisma.user.update({
      where: { id: targetId },
      data: {
        communityRatingAvg: stats.averageRating,
        communityReviewsCount: stats.totalReviews,
      },
    });

    return review;
  }

  async createAlert(
    userId: string,
    dto: {
      categoryId: string;
      governorateId: string;
      cityId: string;
      genderPreference?: GenderPreference;
    },
  ) {
    return this.repo.createAlert({
      userId,
      categoryId: dto.categoryId,
      governorateId: dto.governorateId,
      cityId: dto.cityId,
      genderPreference: dto.genderPreference || GenderPreference.ALL,
    });
  }

  async getMyAlerts(userId: string) {
    return this.repo.getAlertsForUser(userId);
  }

  async toggleAlertStatus(alertId: string, userId: string, isActive: boolean) {
    return this.repo.updateAlertStatus(alertId, userId, isActive);
  }

  // --- Internals for async matches & pushes ---

  private async matchAndDispatchAlerts(post: any) {
    try {
      const matches = await this.repo.findMatchingAlerts({
        categoryId: post.categoryId,
        governorateId: post.governorateId,
        cityId: post.cityId,
        genderPreference: post.genderPreference,
      });

      const uniqueUserIds = Array.from(
        new Set(matches.map((m) => m.userId)),
      ).filter(
        (uid) => uid !== post.userId, // Don't notify the author
      );

      for (const matchedUserId of uniqueUserIds) {
        // Create database notification inside prisma
        const notification = await this.prisma.notification.create({
          data: {
            userId: matchedUserId,
            type: NotificationType.ALERT,
            title: 'نشاط مطابق لاهتماماتك ⚽',
            body: `تم نشر نشاط جديد "${post.title}" يتوافق مع تنبيهاتك المحفوظة. اضغط للتفاصيل!`,
            entityType: 'community_post',
            entityId: post.id,
          },
        });

        // Fire-and-forget push dispatcher
        this.dispatcher.dispatch(notification);
      }
    } catch (e) {
      // fail silently to not interrupt creation promise
    }
  }

  private async notifyHostOfJoinRequest(post: any, requesterId: string) {
    try {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { name: true },
      });

      const notification = await this.prisma.notification.create({
        data: {
          userId: post.userId,
          type: NotificationType.REQUEST,
          title: 'طلب انضمام جديد للنشاط 📢',
          body: `يرغب "${requester?.name}" في الانضمام لنشاطك "${post.title}".`,
          entityType: 'viewing_request.community', // Custom routing entity
          entityId: post.id,
        },
      });

      this.dispatcher.dispatch(notification);
    } catch {
      // silent
    }
  }

  private async notifyUserOfRequestResponse(
    participant: any,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    try {
      const isAccepted = status === 'ACCEPTED';
      const notification = await this.prisma.notification.create({
        data: {
          userId: participant.userId,
          type: NotificationType.ALERT,
          title: isAccepted
            ? 'تم قبول انضمامك للنشاط 🎉'
            : 'عذراً، تم رفض انضمامك 😔',
          body: isAccepted
            ? `وافق المضيف على طلب انضمامك لنشاط "${participant.post.title}". يمكنك الآن بدء محادثة معه!`
            : `تم رفض طلب انضمامك لنشاط "${participant.post.title}".`,
          entityType: 'viewing_request.community_response',
          entityId: participant.postId,
        },
      });

      this.dispatcher.dispatch(notification);
    } catch {
      // silent
    }
  }

  // --- Admin Functions ---

  async adminGetPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.repo.findPosts({
      skip,
      take: limit,
      status: undefined, // Fetches posts with any status
    });
  }

  async adminGetReports(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.repo.findReports(skip, limit);
  }

  async adminUpdatePostStatus(postId: string, status: CommunityPostStatus) {
    const post = await this.repo.findPostById(postId);
    if (!post) {
      throw new NotFoundException('النشاط غير موجود.');
    }
    return this.repo.updatePost(postId, { status });
  }

  async adminResolveReport(reportId: string, status: ReportStatus) {
    return this.repo.updateReportStatus(reportId, status);
  }

  async adminGetStats() {
    const [
      totalActivities,
      totalParticipants,
      pendingReports,
      blockedActivities,
      archivedActivities,
      avgRatingData,
    ] = await Promise.all([
      this.prisma.communityPost.count({ where: { isDeleted: false } }),
      this.prisma.communityParticipant.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.communityReport.count({ where: { status: 'PENDING' } }),
      this.prisma.communityPost.count({
        where: { status: 'BLOCKED', isDeleted: false },
      }),
      this.prisma.communityPost.count({
        where: { status: 'ARCHIVED', isDeleted: false },
      }),
      this.prisma.user.aggregate({
        _avg: {
          communityRatingAvg: true,
        },
        where: {
          communityReviewsCount: { gt: 0 },
        },
      }),
    ]);

    return {
      activities: totalActivities,
      participants: totalParticipants,
      pendingReports,
      blockedActivities,
      archivedActivities,
      averageRating: avgRatingData._avg.communityRatingAvg || 0,
    };
  }
}
