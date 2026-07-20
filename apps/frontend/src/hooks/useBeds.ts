// apps/frontend/src/hooks/useBeds.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { bedsApi } from '@/lib/api/beds.api';
import type { Bed } from '@/types';

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

// The API returns Bed with a runtime 'status' field not in the shared type
type BedFromApi = Bed & { status?: string };

// Response types derived from actual endpoint usage in onSuccess handlers
interface RentBedResponse {
  bed?: BedFromApi;
  message?: string;
}

interface VacateBedResponse {
  bed?: BedFromApi;
  message?: string;
}

export const useListingBeds = (listingId: string | null | undefined, isLandlord = false) => {
  return useQuery<Bed[]>({
    queryKey: ['listings', listingId, 'beds', isLandlord],
    queryFn: async (): Promise<Bed[]> => {
      if (!listingId) return [];
      // المؤجر يستخدم endpoint /all خاص — يبقى مع api مباشرة
      if (isLandlord) {
        const response = await api.get<BedFromApi[]>(`/listings/${listingId}/beds/all`);
        return response.data.map((bed) => ({
          ...bed,
          isAvailable: bed.status === 'available',
        }));
      }
      const response = await bedsApi.getByListing(listingId);
      return (response.data as BedFromApi[]).map((bed) => ({
        ...bed,
        isAvailable: bed.status === 'available',
      }));
    },
    enabled: !!listingId,
  });
};

export const useListingBedStats = (listingId: string | null | undefined) => {
  return useQuery<BedStats>({
    queryKey: ['listings', listingId, 'beds', 'stats'],
    queryFn: async (): Promise<BedStats> => {
      if (!listingId) return { total: 0, available: 0, rented: 0 };
      const response = await bedsApi.getStats(listingId);
      return response.data as BedStats;
    },
    enabled: !!listingId,
  });
};

export const useRentBed = () => {
  const queryClient = useQueryClient();

  return useMutation<RentBedResponse, Error, { bedId: string; data: RentBedPayload }>({
    mutationFn: async ({ bedId, data }): Promise<RentBedResponse> => {
      const response = await bedsApi.rent(bedId, {
        tenantId: data.tenantId,
        rentedSince: data.startDate,
        rentedUntil: data.endDate,
      });
      return response.data as RentBedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      // Access listingId directly through data.bed — avoids ambiguous union type
      const listingId = data?.bed?.listingId;
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ['listings', listingId] });
        queryClient.invalidateQueries({ queryKey: ['listings', listingId, 'beds'] });
      }
    },
  });
};

export const useVacateBed = () => {
  const queryClient = useQueryClient();

  return useMutation<VacateBedResponse, Error, string>({
    mutationFn: async (bedId): Promise<VacateBedResponse> => {
      const response = await bedsApi.vacate(bedId);
      return response.data as VacateBedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      // Access listingId directly through data.bed — avoids ambiguous union type
      const listingId = data?.bed?.listingId;
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ['listings', listingId] });
        queryClient.invalidateQueries({ queryKey: ['listings', listingId, 'beds'] });
      }
    },
  });
};
