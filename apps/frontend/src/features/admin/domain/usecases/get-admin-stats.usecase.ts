// apps/frontend/src/features/admin/domain/usecases/get-admin-stats.usecase.ts
import { adminRepository } from "../../infrastructure/repositories/axios-admin.repository";
import { IAdminRepository } from "../repositories/admin.repository";

export class GetAdminStatsUseCase {
  constructor(private readonly adminRepo: IAdminRepository) {}

  async execute(): Promise<any> {
    return await this.adminRepo.getStats();
  }
}

export const getAdminStatsUseCase = new GetAdminStatsUseCase(adminRepository);
