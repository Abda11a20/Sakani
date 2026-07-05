// apps/frontend/src/hooks/useTenantLookup.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TenantLookupResult {
  id: string;
  name: string;
  phone: string;
  role: string;
}

/**
 * Looks up a tenant by phone number.
 * Only enabled when phone has at least 11 digits (Egyptian minimum).
 * Returns only {id, name, phone, role} — no sensitive fields.
 * Accessible by landlords and admins only (enforced by backend).
 */
export const useLookupTenantByPhone = (phone: string) => {
  const cleanPhone = phone.replace(/\s/g, "");
  const enabled = cleanPhone.length >= 11;

  return useQuery<TenantLookupResult | null>({
    queryKey: ["tenant-lookup", cleanPhone],
    queryFn: async () => {
      try {
        const res = await api.get<TenantLookupResult>(
          `/users/lookup-by-phone?phone=${encodeURIComponent(cleanPhone)}`
        );
        return res.data;
      } catch {
        return null;
      }
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  });
};
