// apps/frontend/src/features/community/domain/usecases/index.ts
import { communityRepository } from "../../infrastructure/repositories/axios-community.repository";
import { GetCommunityPostsUseCase, CreateCommunityPostUseCase } from "./get-posts.usecase";

export * from "./get-posts.usecase";

export const getCommunityPostsUseCase = new GetCommunityPostsUseCase(communityRepository);
export const createCommunityPostUseCase = new CreateCommunityPostUseCase(communityRepository);
