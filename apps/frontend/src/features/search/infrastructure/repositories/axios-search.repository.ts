// apps/frontend/src/features/search/infrastructure/repositories/axios-search.repository.ts
import { api } from "@/lib/api";
import { ISearchRepository, SearchResult } from "../../domain/repositories/search.repository";
import { ListingEntity } from "@/features/listings";

export class AxiosSearchRepository implements ISearchRepository {
  async searchListings(filters: Record<string, unknown>, page = 1, limit = 12): Promise<SearchResult> {
    const cleanParams: Record<string, unknown> = {};

    // Map q/query
    const searchQuery = (filters.q || filters.query) as string | undefined;
    if (searchQuery && searchQuery.trim()) {
      cleanParams.q = searchQuery.trim();
    }

    // Map unitType (lowercase enum for Prisma & DTO validation)
    if (filters.unitType) {
      cleanParams.unitType = String(filters.unitType).toLowerCase();
    }

    // Map genderTarget (lowercase enum for Prisma & DTO validation)
    if (filters.genderTarget) {
      cleanParams.genderTarget = String(filters.genderTarget).toLowerCase();
    }

    if (filters.governorate) cleanParams.governorate = filters.governorate;
    if (filters.district) cleanParams.district = filters.district;
    if (filters.minPrice) cleanParams.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) cleanParams.maxPrice = Number(filters.maxPrice);
    if (filters.isFurnished !== undefined) cleanParams.isFurnished = Boolean(filters.isFurnished);
    if (filters.verifiedOnly !== undefined) cleanParams.verifiedOnly = Boolean(filters.verifiedOnly);

    // Map sortBy
    const sortVal = (filters.sortBy || filters.sort) as string | undefined;
    if (sortVal) {
      if (sortVal === "cheapest") cleanParams.sortBy = "price_asc";
      else if (sortVal === "expensive") cleanParams.sortBy = "price_desc";
      else if (sortVal === "newest" || sortVal === "popular") cleanParams.sortBy = sortVal;
    }

    cleanParams.page = page;
    cleanParams.limit = limit;

    const res = await api.get("/search", { params: cleanParams });
    const rawListings = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.listings || res.data?.items || []);
    const total = res.data?.total ?? (res.data?.meta?.total ?? rawListings.length);

    return {
      listings: rawListings.map((item: any) => new ListingEntity(item)),
      total,
    };
  }
}

export const searchRepository = new AxiosSearchRepository();
