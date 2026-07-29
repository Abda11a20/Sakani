// apps/frontend/src/features/beds/domain/types/beds.types.ts
import type { User } from "@/features/auth";

export interface Bed {
  id: string;
  listingId: string;
  bedNumber: number;
  isAvailable: boolean;
  currentTenantId?: string | null;
  currentTenant?: Pick<User, "id" | "name"> | null;
  tenantId?: string;
  tenant?: Pick<User, "id" | "name"> | null;
}
