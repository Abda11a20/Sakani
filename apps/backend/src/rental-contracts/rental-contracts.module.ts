// apps/backend/src/rental-contracts/rental-contracts.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { RentalContractsService } from './rental-contracts.service';
import { RentalContractsController } from './rental-contracts.controller';
import { LeaseExpiryService } from './lease-expiry.service';
import { ListingsModule } from '../listings/listings.module';
import { BedsModule } from '../beds/beds.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => ListingsModule),
    forwardRef(() => BedsModule),
    AuthModule,
  ],
  controllers: [RentalContractsController],
  providers: [RentalContractsService, LeaseExpiryService],
  exports: [RentalContractsService],
})
export class RentalContractsModule {}
