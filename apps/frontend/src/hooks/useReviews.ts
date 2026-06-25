// apps/frontend/src/hooks/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Review } from "@/types";

export interface CreateReviewPayload {
  listingId: string;
  rating: number;
  comment?: string;
}

export const useLandlordRating = (landlordId: string | null | undefined) => {
  return useQuery<{ ratingAvg: number; reviewsCount: number }>({
    queryKey: ["reviews", "landlord", landlordId, "rating"],
    queryFn: async () => {
      if (!landlordId) return { ratingAvg: 0, reviewsCount: 0 };
      const response = await api.get<{ ratingAvg: number; reviewsCount: number }>(
        `/reviews/landlord/${landlordId}/rating`
      );
      return response.data;
    },
    enabled: !!landlordId,
  });
};

export const useListingReviews = (listingId: string | null | undefined) => {
  return useQuery<Review[]>({
    queryKey: ["reviews", "listing", listingId],
    queryFn: async (): Promise<Review[]> => {
      if (!listingId) return [];
      const response = await api.get<Review[]>(`/reviews/listing/${listingId}`);
      return response.data;
    },
    enabled: !!listingId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewPayload>({
    mutationFn: async (data): Promise<Review> => {
      const response = await api.post<Review>("/reviews", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "listing", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; listingId: string }>({
    mutationFn: async ({ id }): Promise<void> => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: (_, { listingId }) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
    },
  });
};
