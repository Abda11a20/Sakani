// apps/frontend/src/hooks/useUploads.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadsApi } from "@/lib/api/uploads.api";

export interface UploadImageResult {
  id: string;
  url: string;
  order: number;
}

export const useUploadListingImages = (listingId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UploadImageResult[], Error, File[]>({
    mutationFn: async (files): Promise<UploadImageResult[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      const response = await uploadsApi.listingImages(listingId, formData);
      return response.data as UploadImageResult[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { imageId: string; listingId?: string }
  >({
    mutationFn: async ({ imageId }) => {
      const response = await uploadsApi.deleteImage(imageId);
      return response.data as { success: boolean; message: string };
    },
    onSuccess: (_, { listingId }) => {
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      }
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};

export const useReorderImages = (listingId: string) => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string[]>({
    mutationFn: async (imageIds) => {
      const response = await uploadsApi.reorderImages(listingId, imageIds);
      return response.data as { success: boolean; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};
