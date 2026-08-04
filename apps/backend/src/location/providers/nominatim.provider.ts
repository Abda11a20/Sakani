// apps/backend/src/location/providers/nominatim.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  GeocodingProvider,
  LocationResult,
} from '../interfaces/geocoding-provider.interface';

@Injectable()
export class NominatimProvider implements GeocodingProvider {
  private readonly logger = new Logger(NominatimProvider.name);

  // EGYPT Bounding Box Constraints
  private readonly EGYPT_BOUNDS = {
    minLat: 21.5,
    maxLat: 31.8,
    minLng: 24.0,
    maxLng: 37.0,
  };

  /**
   * Sanitizes and deduplicates query text for Egyptian addresses.
   */
  private cleanQuery(query: string): string {
    if (!query) return '';

    // Remove common filler words
    const cleanStr = query
      .replace(
        /(بجوار|أمام|بجانب|فوق|تحت|شقة|عمارة|دور|شارع|طريق|ميدان)\s+[^\s,]+/gi,
        (match) => {
          // Keep the main name if useful, but strip filler prefixes
          return match.replace(
            /^(بجوار|أمام|بجانب|فوق|تحت|شقة|عمارة|دور)\s+/gi,
            '',
          );
        },
      )
      .trim();

    // Deduplicate tokens
    const tokens = cleanStr
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    const uniqueTokens: string[] = [];
    for (const token of tokens) {
      const normalized = token
        .toLowerCase()
        .replace(/[أإآآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
      if (
        !uniqueTokens.some(
          (ut) =>
            ut
              .toLowerCase()
              .replace(/[أإآآ]/g, 'ا')
              .replace(/ة/g, 'ه')
              .replace(/ى/g, 'ي') === normalized,
        )
      ) {
        uniqueTokens.push(token);
      }
    }

    if (!uniqueTokens.some((t) => t.includes('مصر'))) {
      uniqueTokens.push('مصر');
    }

    return uniqueTokens.join(' ');
  }

  /**
   * Checks if coordinates fall strictly within Egyptian geographical boundaries.
   */
  private isWithinEgypt(lat: number, lng: number): boolean {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= this.EGYPT_BOUNDS.minLat &&
      lat <= this.EGYPT_BOUNDS.maxLat &&
      lng >= this.EGYPT_BOUNDS.minLng &&
      lng <= this.EGYPT_BOUNDS.maxLng
    );
  }

  async geocode(rawQuery: string): Promise<LocationResult[]> {
    const cleanedQuery = this.cleanQuery(rawQuery);
    if (!cleanedQuery) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedQuery)}&format=json&limit=3&countrycodes=eg&accept-language=ar`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Sakany-App-Production/1.0 (contact@sakany.app)',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim HTTP error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      const results: LocationResult[] = [];
      for (const item of data) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        // Strict Egypt bounds check & valid numeric checks
        if (this.isWithinEgypt(lat, lng)) {
          const confidence =
            item.importance > 0.5
              ? 'high'
              : item.importance > 0.3
                ? 'medium'
                : 'low';
          results.push({
            lat,
            lng,
            displayName: item.display_name,
            confidence,
          });
        }
      }

      return results;
    } catch (error: any) {
      this.logger.error(
        `Geocoding error for query "${rawQuery}": ${error?.message}`,
      );
      return [];
    }
  }

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<LocationResult | null> {
    if (!this.isWithinEgypt(lat, lng)) {
      return null;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Sakany-App-Production/1.0 (contact@sakany.app)',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || !data.display_name) return null;

      return {
        lat,
        lng,
        displayName: data.display_name,
        confidence: 'high',
      };
    } catch {
      return null;
    }
  }
}
