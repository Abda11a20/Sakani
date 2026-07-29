// apps/frontend/src/features/listings/infrastructure/repositories/axios-listing.repository.ts
import { api } from "@/lib/api";
import { IListingRepository } from "../../domain/repositories/listing.repository";
import { ListingEntity } from "../../domain/entities/listing.entity";

export class AxiosListingRepository implements IListingRepository {
  async getAll(params?: Record<string, unknown>): Promise<{ listings: ListingEntity[]; total: number }> {
    const res = await api.get("/listings", { params });
    const rawListings = Array.isArray(res.data) ? res.data : (res.data?.listings || res.data?.data || []);
    const total = res.data?.total ?? rawListings.length;
    return {
      listings: rawListings.map((item: any) => new ListingEntity(item)),
      total,
    };
  }

  async getMy(): Promise<ListingEntity[]> {
    const res = await api.get("/listings/my");
    const raw = Array.isArray(res.data) ? res.data : (res.data?.listings || []);
    return raw.map((item: any) => new ListingEntity(item));
  }

  async getOne(id: string): Promise<ListingEntity | null> {
    const res = await api.get(`/listings/${id}`);
    if (!res.data) return null;
    const raw = res.data.listing || res.data;
    return new ListingEntity(raw);
  }

  async create(data: Record<string, unknown>): Promise<ListingEntity> {
    const res = await api.post("/listings", data);
    return new ListingEntity(res.data.listing || res.data);
  }

  async update(id: string, data: Record<string, unknown>): Promise<ListingEntity> {
    const res = await api.patch(`/listings/${id}`, data);
    return new ListingEntity(res.data.listing || res.data);
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  }

  async republish(id: string): Promise<void> {
    await api.patch(`/listings/${id}/republish`);
  }

  async recordView(id: string): Promise<void> {
    await api.post(`/listings/${id}/view`).catch(() => {});
  }

  async getSuggested(id: string): Promise<ListingEntity[]> {
    const res = await api.get(`/search/suggested/${id}`);
    const raw = Array.isArray(res.data) ? res.data : (res.data?.listings || []);
    return raw.map((item: any) => new ListingEntity(item));
  }

  async getPopularDistricts(): Promise<{ district: string; governorate: string; count: number }[]> {
    const res = await api.get("/search/popular-districts");
    return res.data;
  }

  async getPriceStats(params?: { governorate?: string; district?: string }): Promise<any> {
    const res = await api.get("/search/price-stats", { params });
    return res.data;
  }
}

export const listingRepository = new AxiosListingRepository();
