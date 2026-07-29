// apps/frontend/src/features/listings/services/listings.service.ts
import { getListingsUseCase, getListingByIdUseCase, createListingUseCase } from "../domain/usecases";
import type { Listing, SearchFilters } from "@/types";

export const listingsService = {
  async fetchListings(filters?: SearchFilters): Promise<Listing[]> {
    const res = await getListingsUseCase.execute(filters as Record<string, unknown>);
    return res.listings.map((l) => l.toJSON() as Listing);
  },

  async fetchListingById(id: string): Promise<Listing | null> {
    const entity = await getListingByIdUseCase.execute(id);
    return entity ? (entity.toJSON() as Listing) : null;
  },

  async createListing(data: Record<string, unknown>): Promise<Listing> {
    const entity = await createListingUseCase.execute(data);
    return entity.toJSON() as Listing;
  },
};
