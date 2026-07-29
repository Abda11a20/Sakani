// apps/frontend/src/features/auth/domain/usecases/register.usecase.ts
import { IAuthRepository, RegisterPayload } from "../repositories/auth.repository";

export class RegisterUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(payload: RegisterPayload): Promise<{ userId: string; requiresOtp: boolean }> {
    if (!payload.name || !payload.phone || !payload.nationalId) {
      throw new Error("Missing required registration fields.");
    }
    return await this.authRepo.register(payload);
  }
}
