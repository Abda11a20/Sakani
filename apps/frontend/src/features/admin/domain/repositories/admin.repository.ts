// apps/frontend/src/features/admin/domain/repositories/admin.repository.ts

export interface IAdminRepository {
  getHealth(): Promise<any>;
  getStats(): Promise<any>;
  getPendingListings(params?: Record<string, any>): Promise<any>;
  reviewListing(id: string, data: { status: string; rejectionReason?: string }): Promise<any>;
  deleteListing(id: string): Promise<any>;
  getDeletedListings(params?: Record<string, any>): Promise<any>;
  softDeleteListing(id: string, reason?: string): Promise<any>;
  restoreListing(id: string): Promise<any>;
  deleteListingImages(id: string): Promise<any>;
  getUsers(params?: Record<string, any>): Promise<any>;
  verifyUser(id: string): Promise<any>;
  rejectUser(userId: string): Promise<any>;
  toggleUserStatus(id: string): Promise<any>;
  updateUserRole(id: string, payload: any): Promise<any>;
  deleteUser(id: string): Promise<any>;
  registerAdmin(payload: any): Promise<any>;
  banUser(data: { reason: string; nationalIdHash?: string; phone?: string }): Promise<any>;
  getBanned(page?: number, search?: string): Promise<any>;
  unban(id: string): Promise<any>;
  getRequests(params?: Record<string, any>): Promise<any>;
  getIdCardUrl(userId: string): Promise<any>;
  getSupportConversations(params?: Record<string, any>): Promise<any>;
  blockUserInSupport(conversationId: string, reason?: string): Promise<any>;
  unblockUserInSupport(conversationId: string): Promise<any>;
  getAdminRentals(params?: Record<string, any>): Promise<any>;
  getCommunityReports(params?: Record<string, any>): Promise<any>;
  resolveCommunityReport(id: string, status: string): Promise<any>;
  getCommunityStats(): Promise<any>;
  getCommunityPosts(params?: Record<string, any>): Promise<any>;
  getArchivedCommunityPosts(params?: Record<string, any>): Promise<any>;
  updateCommunityPostStatus(id: string, status: string): Promise<any>;
  restoreCommunityPost(id: string): Promise<any>;
}
