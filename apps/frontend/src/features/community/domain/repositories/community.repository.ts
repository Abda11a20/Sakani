// apps/frontend/src/features/community/domain/repositories/community.repository.ts

export interface ICommunityRepository {
  getPost(id: string): Promise<any>;
  getCategories(): Promise<any>;
  getPosts(params?: Record<string, any>): Promise<any>;
  createPost(payload: any): Promise<any>;
  createAlert(payload: any): Promise<any>;
  joinPost(id: string): Promise<any>;
  leavePost(id: string): Promise<any>;
  updateParticipantStatus(participantId: string, status: string): Promise<any>;
  cancelPost(id: string): Promise<any>;
  deletePost(id: string): Promise<any>;
  reportPost(id: string, payload: { reason: string; details?: string }): Promise<any>;
  ratePost(id: string, payload: { targetUserId: string; score: number; comment?: string }): Promise<any>;
}
