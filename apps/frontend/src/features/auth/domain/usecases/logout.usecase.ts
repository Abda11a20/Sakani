// apps/frontend/src/features/auth/domain/usecases/logout.usecase.ts
import { IAuthRepository } from "../repositories/auth.repository";

export class LogoutUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepo.logout();
  }
}
