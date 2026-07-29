// apps/frontend/src/features/auth/domain/usecases/login.usecase.ts
import { IAuthRepository, LoginCredentials, AuthDomainResult } from "../repositories/auth.repository";

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthDomainResult> {
    if (!credentials.identifier) {
      throw new Error("Phone or email identifier is required.");
    }
    return await this.authRepo.login(credentials);
  }
}
