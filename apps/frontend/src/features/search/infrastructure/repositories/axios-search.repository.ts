// apps/frontend/src/features/search/infrastructure/repositories/axios-search.repository.ts
import { api } from "@/lib/api";
import { ISearchRepository, SearchResult } from "../../domain/repositories/search.repository";
import { ListingEntity } from "@/features/listings";

export class AxiosSearchRepository implements ISearchRepository {
  async searchListings(filters: Record<string, unknown>, page = 1, limit = 12): Promise<SearchResult> {
    const res = await api.get("/search", {
      params: { ...filters, page, limit },
    });
    const rawListings = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.listings || []);
    const total = res.data?.total ?? (res.data?.meta?.total ?? rawListings.length);
    return {
      listings: rawListings.map((item: any) => new ListingEntity(item)),
      total,
    };
  }
}

export const searchRepository = new AxiosSearchRepository();
