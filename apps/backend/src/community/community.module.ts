// apps/backend/src/community/community.module.ts

import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { AdminCommunityController } from './admin-community.controller';
import { CommunityService } from './community.service';
import { CommunityRepository } from './community.repository';
import { CommunityArchiveScheduler } from './community-archive.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService, CommunityRepository, CommunityArchiveScheduler],
  exports: [CommunityService, CommunityRepository],
})
export class CommunityModule {}
