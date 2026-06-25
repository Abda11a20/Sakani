// apps/backend/src/beds/beds.module.ts

import { Module } from '@nestjs/common';
import { BedsService } from './beds.service';
import { BedsController } from './beds.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
