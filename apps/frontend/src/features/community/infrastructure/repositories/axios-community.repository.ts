// apps/frontend/src/features/community/infrastructure/repositories/axios-community.repository.ts
import { api } from "@/lib/api";
import { ICommunityRepository } from "../../domain/repositories/community.repository";

export class AxiosCommunityRepository implements ICommunityRepository {
  async getPost(id: string): Promise<any> {
    const res = await api.get(`/community/${id}`);
    return res.data;
  }

  async getCategories(): Promise<any> {
    const res = await api.get("/community/categories");
    return res.data;
  }

  async getPosts(params?: Record<string, any>): Promise<any> {
    const res = await api.get("/community", { params });
    return res.data;
  }

  async createPost(payload: any): Promise<any> {
    const res = await api.post("/community", payload);
    return res.data;
  }

  async createAlert(payload: any): Promise<any> {
    const res = await api.post("/community/alerts", payload);
    return res.data;
  }

  async joinPost(id: string): Promise<any> {
    const res = await api.post(`/community/${id}/join`);
    return res.data;
  }

  async leavePost(id: string): Promise<any> {
    const res = await api.post(`/community/${id}/leave`);
    return res.data;
  }

  async updateParticipantStatus(participantId: string, status: string): Promise<any> {
    const res = await api.patch(`/community/participants/${participantId}`, { status });
    return res.data;
  }

  async cancelPost(id: string): Promise<any> {
    const res = await api.post(`/community/${id}/cancel`);
    return res.data;
  }

  async deletePost(id: string): Promise<any> {
    const res = await api.delete(`/community/${id}`);
    return res.data;
  }

  async reportPost(id: string, payload: { reason: string; details?: string }): Promise<any> {
    const res = await api.post(`/community/${id}/report`, payload);
    return res.data;
  }

  async ratePost(id: string, payload: { targetUserId: string; score: number; comment?: string }): Promise<any> {
    const res = await api.post(`/community/${id}/rate`, payload);
    return res.data;
  }
}

export const communityRepository = new AxiosCommunityRepository();
