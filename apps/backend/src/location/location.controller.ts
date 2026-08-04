// apps/backend/src/location/location.controller.ts

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('geocode')
  async geocode(
    @Query('governorate') governorate?: string,
    @Query('district') district?: string,
    @Query('address') address?: string,
  ) {
    return this.locationService.geocodeAddress(governorate, district, address);
  }

  @Get('reverse-geocode')
  async reverseGeocode(
    @Query('lat') latStr?: string,
    @Query('lng') lngStr?: string,
  ) {
    const lat = parseFloat(latStr || '');
    const lng = parseFloat(lngStr || '');

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      throw new BadRequestException('إحداثيات جغرافية غير صالحة');
    }

    if (lat < 21.5 || lat > 31.8 || lng < 24.0 || lng > 37.0) {
      throw new BadRequestException(
        'الإحداثيات الجغرافية يجب أن تقع داخل حدود جمهورية مصر العربية',
      );
    }

    const result = await this.locationService.reverseGeocode(lat, lng);
    return { result };
  }
}
