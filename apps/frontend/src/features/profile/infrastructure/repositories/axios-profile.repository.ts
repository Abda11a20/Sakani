// apps/frontend/src/features/profile/infrastructure/repositories/axios-profile.repository.ts
import { api } from "@/lib/api";
import { IProfileRepository, TenantLookupResult } from "../../domain/repositories/profile.repository";

export class AxiosProfileRepository implements IProfileRepository {
  async getProfile(): Promise<any> {
    const res = await api.get("/users/profile");
    return res.data;
  }

  async updateProfile(data: { name?: string; avatarUrl?: string }): Promise<any> {
    const res = await api.patch("/users/profile", data);
    return res.data;
  }

  async deleteProfile(reason?: string): Promise<any> {
    const res = await api.delete("/users/profile", { data: { reason } });
    return res.data;
  }

  async getPublic(id: string): Promise<any> {
    const res = await api.get(`/users/${id}`);
    return res.data;
  }

  async lookupByPhone(phone: string): Promise<TenantLookupResult> {
    const res = await api.get<TenantLookupResult>(`/users/lookup-by-phone?phone=${phone}`);
    return res.data;
  }
}

export const profileRepository = new AxiosProfileRepository();
