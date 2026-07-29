// apps/frontend/src/features/search/services/search.service.ts
import { searchListingsUseCase } from "../domain/usecases/search-listings.usecase";
import type { Listing, SearchFilters } from "@/types";

export const searchService = {
  async searchListings(filters: SearchFilters & { sort?: string; q?: string; query?: string }, page = 1, limit = 12): Promise<{ listings: Listing[]; total: number }> {
    const res = await searchListingsUseCase.execute(filters as Record<string, unknown>, page, limit);
    return {
      listings: res.listings.map((l: any) => l.toJSON() as Listing),
      total: res.total,
    };
  },
};
