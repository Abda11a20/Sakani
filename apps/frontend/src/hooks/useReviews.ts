// apps/frontend/src/hooks/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { reviewsApi } from "@/lib/api/reviews.api";
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
      const response = await reviewsApi.getLandlordRating(landlordId);
      return response.data as { ratingAvg: number; reviewsCount: number };
    },
    enabled: !!landlordId,
  });
};

export const useListingReviews = (listingId: string | null | undefined) => {
  return useQuery<Review[]>({
    queryKey: ["reviews", "listing", listingId],
    queryFn: async (): Promise<Review[]> => {
      if (!listingId) return [];
      const response = await reviewsApi.getByListing(listingId);
      return response.data as Review[];
    },
    enabled: !!listingId,
  });
};

// useMyReviews uses a special endpoint not in reviewsApi — kept with api directly
export const useMyReviews = () => {
  return useQuery<Review[]>({
    queryKey: ["reviews", "my"],
    queryFn: async (): Promise<Review[]> => {
      const response = await api.get<Review[]>("/reviews/my");
      return response.data;
    },
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewPayload>({
    mutationFn: async (data): Promise<Review> => {
      const response = await reviewsApi.create(data);
      return response.data as Review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "listing", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "my"] });
      queryClient.invalidateQueries({ queryKey: ["listings", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; listingId: string }>({
    mutationFn: async ({ id }): Promise<void> => {
      await reviewsApi.delete(id);
    },
    onSuccess: (_, { listingId }) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "my"] });
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
    },
  });
};
