// apps/frontend/src/features/search/domain/repositories/search.repository.ts
import { ListingEntity } from "@/features/listings";

export interface SearchResult {
  listings: ListingEntity[];
  total: number;
}

export interface ISearchRepository {
  searchListings(filters: Record<string, unknown>, page?: number, limit?: number): Promise<SearchResult>;
}
