// apps/backend/src/listings/listings.module.ts

import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AuthModule } from '../auth/auth.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuthModule, AlertsModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
