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

export const useListingBeds = (listingId: string | null | undefined, isLandlord = false) => {
  return useQuery<Bed[]>({
    queryKey: ["listings", listingId, "beds", isLandlord],
    queryFn: async (): Promise<Bed[]> => {
      if (!listingId) return [];
      const endpoint = isLandlord
        ? `/listings/${listingId}/beds/all`
        : `/listings/${listingId}/beds`;
      const response = await api.get<any[]>(endpoint);
      return response.data.map((bed: any) => ({
        ...bed,
        isAvailable: bed.status === "available",
      }));
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

  return useMutation<any, Error, { bedId: string; data: RentBedPayload }>({
    mutationFn: async ({ bedId, data }): Promise<any> => {
      const response = await api.patch<any>(`/beds/${bedId}/rent`, {
        tenantId: data.tenantId,
        rentedSince: data.startDate,
        rentedUntil: data.endDate,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const bed = data?.bed || data;
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      if (bed?.listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId, "beds"] });
      }
    },
  });
};

export const useVacateBed = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (bedId): Promise<any> => {
      const response = await api.patch<any>(`/beds/${bedId}/vacate`);
      return response.data;
    },
    onSuccess: (data) => {
      const bed = data?.bed || data;
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      if (bed?.listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId, "beds"] });
      }
    },
  });
};
