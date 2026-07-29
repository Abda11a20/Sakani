// apps/frontend/src/features/admin/infrastructure/repositories/axios-admin.repository.ts
import { api } from "@/lib/api";
import { IAdminRepository } from "../../domain/repositories/admin.repository";

export class AxiosAdminRepository implements IAdminRepository {
  getHealth() { return api.get("/health").then(r => r.data); }
  getStats() { return api.get("/admin/dashboard/stats").then(r => r.data); }
  getPendingListings(params?: Record<string, any>) { return api.get("/admin/listings/pending", { params }).then(r => r.data); }
  reviewListing(id: string, data: { status: string; rejectionReason?: string }) { return api.patch(`/admin/listings/${id}/review`, data).then(r => r.data); }
  deleteListing(id: string) { return api.delete(`/admin/listings/${id}`).then(r => r.data); }
  getDeletedListings(params?: Record<string, any>) { return api.get("/admin/deleted-listings", { params }).then(r => r.data); }
  softDeleteListing(id: string, reason?: string) { return api.patch(`/admin/listings/${id}/soft-delete`, { reason }).then(r => r.data); }
  restoreListing(id: string) { return api.patch(`/admin/listings/${id}/restore`).then(r => r.data); }
  deleteListingImages(id: string) { return api.delete(`/admin/listings/${id}/images`).then(r => r.data); }
  getUsers(params?: Record<string, any>) { return api.get("/admin/users", { params }).then(r => r.data); }
  verifyUser(id: string) { return api.patch(`/admin/users/${id}/verify`).then(r => r.data); }
  rejectUser(userId: string) { return api.patch(`/admin/users/${userId}/reject`).then(r => r.data); }
  toggleUserStatus(id: string) { return api.patch(`/admin/users/${id}/toggle-status`).then(r => r.data); }
  updateUserRole(id: string, payload: any) { return api.patch(`/admin/users/${id}/role`, payload).then(r => r.data); }
  deleteUser(id: string) { return api.delete(`/admin/users/${id}`).then(r => r.data); }
  registerAdmin(payload: any) { return api.post("/admin/register-admin", payload).then(r => r.data); }
  banUser(data: { reason: string; nationalIdHash?: string; phone?: string }) { return api.post("/admin/ban", data).then(r => r.data); }
  getBanned(page = 1, search?: string) { return api.get("/admin/banned", { params: { page, search } }).then(r => r.data); }
  unban(id: string) { return api.delete(`/admin/banned/${id}`).then(r => r.data); }
  getRequests(params?: Record<string, any>) { return api.get("/admin/requests", { params }).then(r => r.data); }
  getIdCardUrl(userId: string) { return api.get(`/uploads/id-card/${userId}`).then(r => r.data); }
  getSupportConversations(params?: Record<string, any>) { return api.get("/admin/chat/conversations", { params }).then(r => r.data); }
  blockUserInSupport(conversationId: string, reason?: string) { return api.post(`/admin/chat/conversations/${conversationId}/block`, { reason }).then(r => r.data); }
  unblockUserInSupport(conversationId: string) { return api.post(`/admin/chat/conversations/${conversationId}/unblock`).then(r => r.data); }
  getAdminRentals(params?: Record<string, any>) { return api.get("/rental-history/admin", { params }).then(r => r.data); }
  getCommunityReports(params?: Record<string, any>) { return api.get("/admin/community/reports", { params }).then(r => r.data); }
  resolveCommunityReport(id: string, status: string) { return api.patch(`/admin/community/reports/${id}/resolve`, { status }).then(r => r.data); }
  getCommunityStats() { return api.get("/admin/community/stats").then(r => r.data); }
  getCommunityPosts(params?: Record<string, any>) { return api.get("/admin/community/posts", { params }).then(r => r.data); }
  getArchivedCommunityPosts(params?: Record<string, any>) { return api.get("/admin/community/archived", { params }).then(r => r.data); }
  updateCommunityPostStatus(id: string, status: string) { return api.patch(`/admin/community/posts/${id}/status`, { status }).then(r => r.data); }
  restoreCommunityPost(id: string) { return api.patch(`/admin/community/posts/${id}/restore`).then(r => r.data); }
}

export const adminRepository = new AxiosAdminRepository();
