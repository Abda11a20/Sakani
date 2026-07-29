// apps/backend/src/location/location.module.ts

import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { NominatimProvider } from './providers/nominatim.provider';

@Module({
  controllers: [LocationController],
  providers: [LocationService, NominatimProvider],
  exports: [LocationService],
})
export class LocationModule {}
