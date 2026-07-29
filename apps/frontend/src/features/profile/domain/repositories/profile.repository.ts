// apps/frontend/src/features/profile/domain/repositories/profile.repository.ts

export interface TenantLookupResult {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export interface IProfileRepository {
  getProfile(): Promise<any>;
  updateProfile(data: { name?: string; avatarUrl?: string }): Promise<any>;
  getPublic(id: string): Promise<any>;
  lookupByPhone(phone: string): Promise<TenantLookupResult>;
}
