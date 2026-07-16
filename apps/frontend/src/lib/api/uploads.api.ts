// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/uploads.api.ts
import apiClient from "@/lib/api";

export const uploadsApi = {
  listingImages: (listingId: string, formData: FormData) =>
    apiClient.post(
      `/uploads/listings/${listingId}/images`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),

  deleteImage: (imageId: string) =>
    apiClient.delete(`/uploads/images/${imageId}`),

  reorderImages: (listingId: string, imageIds: string[]) =>
    apiClient.patch(`/uploads/listings/${listingId}/images/reorder`, { imageIds }),

  avatar: (formData: FormData) =>
    apiClient.post("/uploads/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  idCard: (formData: FormData) =>
    apiClient.post("/uploads/id-card", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getIdCardUrl: (userId: string) =>
    apiClient.get(`/uploads/id-card/${userId}`),
};
