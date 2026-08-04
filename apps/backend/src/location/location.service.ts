// apps/backend/src/location/location.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { NominatimProvider } from './providers/nominatim.provider';
import { LocationResult } from './interfaces/geocoding-provider.interface';

interface CacheEntry {
  results: LocationResult[];
  timestamp: number;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes L1 cache

  constructor(private readonly provider: NominatimProvider) {}

  private getCacheKey(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[أإآآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  }

  async geocodeAddress(
    governorate?: string,
    district?: string,
    address?: string,
  ): Promise<{ results: LocationResult[]; message?: string }> {
    const rawParts = [address, district, governorate]
      .filter(Boolean)
      .map((s) => s?.trim());
    if (rawParts.length === 0) {
      return { results: [] };
    }

    // Build hierarchical search candidates
    const fullQuery = rawParts.join(' ');
    const districtQuery = [district, governorate].filter(Boolean).join(' ');
    const govQuery = governorate ? `${governorate}` : '';

    const cacheKey = this.getCacheKey(fullQuery);

    // 1. Check L1 Cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for query: "${fullQuery}"`);
      return { results: cached.results };
    }

    // 2. Execute Hierarchical Geocoding Candidate Pipeline
    let sourceLevel:
      | 'address'
      | 'cleaned_address'
      | 'district'
      | 'governorate' = 'address';

    // Candidate 1: Full raw query (address + district + governorate)
    let results = await this.provider.geocode(fullQuery);
    if (results.length > 0) {
      sourceLevel = 'address';
    }

    // Candidate 2: Address minus district name + governorate (e.g. "سنديون قليوب" - "قليوب" => "سنديون" + "القليوبية")
    if (results.length === 0 && address && district && governorate) {
      const cleanedAddr = address
        .replace(new RegExp(district, 'gi'), '')
        .trim();
      if (cleanedAddr && cleanedAddr.length > 1) {
        const cleanedAddrQuery = `${cleanedAddr} ${governorate}`;
        this.logger.debug(
          `Trying cleaned address candidate: "${cleanedAddrQuery}"`,
        );
        results = await this.provider.geocode(cleanedAddrQuery);
        if (results.length > 0) sourceLevel = 'cleaned_address';
      }
    }

    // Candidate 3: First word/token of address + governorate (e.g. "سنديون" + "القليوبية")
    if (results.length === 0 && address && governorate) {
      const firstToken = address.trim().split(/[\s,]+/)[0];
      if (firstToken && firstToken.length > 2 && firstToken !== district) {
        const tokenQuery = `${firstToken} ${governorate}`;
        this.logger.debug(`Trying address token candidate: "${tokenQuery}"`);
        results = await this.provider.geocode(tokenQuery);
        if (results.length > 0) sourceLevel = 'cleaned_address';
      }
    }

    // Candidate 4: Fallback to district + governorate
    if (results.length === 0 && districtQuery && districtQuery !== fullQuery) {
      this.logger.debug(`Fallback query for district: "${districtQuery}"`);
      results = await this.provider.geocode(districtQuery);
      if (results.length > 0) sourceLevel = 'district';
    }

    // Candidate 5: Fallback to governorate
    if (results.length === 0 && govQuery && govQuery !== districtQuery) {
      this.logger.debug(`Fallback query for governorate: "${govQuery}"`);
      results = await this.provider.geocode(govQuery);
      if (results.length > 0) sourceLevel = 'governorate';
    }

    const finalResults = results.map((r) => ({ ...r, sourceLevel }));

    // 3. Save to L1 Cache
    if (finalResults.length > 0) {
      this.cache.set(cacheKey, {
        results: finalResults,
        timestamp: Date.now(),
      });
    }

    return {
      results: finalResults,
      message:
        finalResults.length === 0
          ? 'لم نتمكن من العثور على نتائج مطابقة تلقائياً. يمكنك تحديد الموقع يدويًا على الخريطة.'
          : undefined,
    };
  }

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<LocationResult | null> {
    if (!this.provider.reverseGeocode) return null;
    return this.provider.reverseGeocode(lat, lng);
  }
}
