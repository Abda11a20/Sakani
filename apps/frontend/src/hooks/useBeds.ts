// apps/frontend/src/hooks/useBeds.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bed } from "@/types";

export interface BedStats {
  total: number;
  available: number;
  rented: number;
}

export interface RentBedPayload {
  tenantId: string;
  startDate: string;
  endDate: string;
}

export const useListingBeds = (listingId: string | null | undefined) => {
  return useQuery<Bed[]>({
    queryKey: ["listings", listingId, "beds"],
    queryFn: async (): Promise<Bed[]> => {
      if (!listingId) return [];
      const response = await api.get<Bed[]>(`/listings/${listingId}/beds`);
      return response.data;
    },
    enabled: !!listingId,
  });
};

export const useListingBedStats = (listingId: string | null | undefined) => {
  return useQuery<BedStats>({
    queryKey: ["listings", listingId, "beds", "stats"],
    queryFn: async (): Promise<BedStats> => {
      if (!listingId) return { total: 0, available: 0, rented: 0 };
      const response = await api.get<BedStats>(`/listings/${listingId}/beds/stats`);
      return response.data;
    },
    enabled: !!listingId,
  });
};

export const useRentBed = () => {
  const queryClient = useQueryClient();

  return useMutation<Bed, Error, { bedId: string; data: RentBedPayload }>({
    mutationFn: async ({ bedId, data }): Promise<Bed> => {
      const response = await api.patch<Bed>(`/beds/${bedId}/rent`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", data.listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings", data.listingId, "beds"] });
    },
  });
};

export const useVacateBed = () => {
  const queryClient = useQueryClient();

  return useMutation<Bed, Error, string>({
    mutationFn: async (bedId): Promise<Bed> => {
      const response = await api.patch<Bed>(`/beds/${bedId}/vacate`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", data.listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings", data.listingId, "beds"] });
    },
  });
};
