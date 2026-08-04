import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdsController } from './ads.controller';
import { AdsAdminController } from './ads-admin.controller';
import { AdsService } from './ads.service';
import { AdEventListener } from './events/ad-event.listener';
import {
  AdCacheService,
  MemoryAdCacheService,
} from './interfaces/ad-cache.interface';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [AdsController, AdsAdminController],
  providers: [
    AdsService,
    AdEventListener,
    {
      provide: AdCacheService,
      useClass: MemoryAdCacheService,
    },
  ],
  exports: [AdsService],
})
export class AdsModule {}
