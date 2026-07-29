// apps/frontend/src/features/community/domain/usecases/get-posts.usecase.ts
import { ICommunityRepository } from "../repositories/community.repository";

export class GetCommunityPostsUseCase {
  constructor(private readonly communityRepo: ICommunityRepository) {}

  async execute(params?: Record<string, any>): Promise<any> {
    return await this.communityRepo.getPosts(params);
  }
}

export class CreateCommunityPostUseCase {
  constructor(private readonly communityRepo: ICommunityRepository) {}

  async execute(payload: any): Promise<any> {
    if (!payload.title || !payload.content) {
      throw new Error("Title and content are required for community post.");
    }
    return await this.communityRepo.createPost(payload);
  }
}
