// apps/backend/src/requests/requests.module.ts

import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { AuthModule } from '../auth/auth.module';
import { BedsModule } from '../beds/beds.module';
import { RentalContractsModule } from '../rental-contracts/rental-contracts.module';

@Module({
  imports: [AuthModule, BedsModule, RentalContractsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
