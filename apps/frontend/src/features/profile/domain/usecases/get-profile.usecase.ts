// apps/frontend/src/features/profile/domain/usecases/get-profile.usecase.ts
import { profileRepository } from "../../infrastructure/repositories/axios-profile.repository";
import { IProfileRepository } from "../repositories/profile.repository";

export class GetProfileUseCase {
  constructor(private readonly profileRepo: IProfileRepository) {}

  async execute(): Promise<any> {
    return await this.profileRepo.getProfile();
  }
}

export const getProfileUseCase = new GetProfileUseCase(profileRepository);
