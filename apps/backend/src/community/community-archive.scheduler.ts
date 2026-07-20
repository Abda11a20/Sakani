// apps/backend/src/community/community-archive.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommunityRepository } from './community.repository';
import {
  CommunityPostStatus,
  CommunityParticipantStatus,
} from '@prisma/client';

@Injectable()
export class CommunityArchiveScheduler {
  private readonly logger = new Logger(CommunityArchiveScheduler.name);

  constructor(private readonly repo: CommunityRepository) {}

  /**
   * Runs every hour to auto-archive posts that have passed their eventDate
   * and marks pending participant join requests older than 7 days as EXPIRED.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoArchive() {
    this.logger.log('⏳ Running community auto-archiving scheduler...');

    try {
      // 1. Archive past posts
      const pastPosts = await this.repo.getActivePastPosts();
      let archivedPostsCount = 0;

      for (const post of pastPosts) {
        await this.repo.updatePost(post.id, {
          status: CommunityPostStatus.ARCHIVED,
        });
        archivedPostsCount++;
      }

      if (archivedPostsCount > 0) {
        this.logger.log(
          `✅ Auto-archived ${archivedPostsCount} past community posts.`,
        );
      }

      // 2. Expire old pending join requests (older than 7 days)
      const expiredParticipants =
        await this.repo.getExpiredPendingParticipants();
      let expiredRequestsCount = 0;

      for (const p of expiredParticipants) {
        await this.repo.updateParticipantStatus(
          p.id,
          CommunityParticipantStatus.EXPIRED,
        );
        expiredRequestsCount++;
      }

      if (expiredRequestsCount > 0) {
        this.logger.log(
          `✅ Marked ${expiredRequestsCount} pending join requests as EXPIRED.`,
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Error occurred during community auto-archiving scheduler execution:',
        error,
      );
    }
  }
}
