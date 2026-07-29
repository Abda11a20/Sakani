// apps/backend/src/location/interfaces/geocoding-provider.interface.ts

export interface LocationResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: 'high' | 'medium' | 'low';
  sourceLevel?: 'address' | 'cleaned_address' | 'district' | 'governorate';
  district?: string;
  governorate?: string;
}

export interface GeocodingProvider {
  geocode(query: string): Promise<LocationResult[]>;
  reverseGeocode?(lat: number, lng: number): Promise<LocationResult | null>;
}
