// apps/frontend/src/features/listings/domain/repositories/listing.repository.ts
import { ListingEntity } from "../entities/listing.entity";

export interface IListingRepository {
  getAll(params?: Record<string, unknown>): Promise<{ listings: ListingEntity[]; total: number }>;
  getMy(): Promise<ListingEntity[]>;
  getOne(id: string): Promise<ListingEntity | null>;
  create(data: Record<string, unknown>): Promise<ListingEntity>;
  update(id: string, data: Record<string, unknown>): Promise<ListingEntity>;
  remove(id: string): Promise<void>;
  republish(id: string): Promise<void>;
  recordView(id: string): Promise<void>;
  getSuggested(id: string): Promise<ListingEntity[]>;
  getPopularDistricts(): Promise<{ district: string; governorate: string; count: number }[]>;
  getPriceStats(params?: { governorate?: string; district?: string }): Promise<any>;
}
