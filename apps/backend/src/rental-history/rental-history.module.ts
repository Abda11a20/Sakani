// apps/backend/src/rental-history/rental-history.module.ts

import { Module } from '@nestjs/common';
import { RentalHistoryController } from './rental-history.controller';
import { RentalHistoryService } from './rental-history.service';

@Module({
  controllers: [RentalHistoryController],
  providers: [RentalHistoryService],
})
export class RentalHistoryModule {}
