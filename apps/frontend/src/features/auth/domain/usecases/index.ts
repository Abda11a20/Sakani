// apps/frontend/src/features/auth/domain/usecases/index.ts
import { authRepository } from "../../infrastructure/repositories/axios-auth.repository";
import { LoginUseCase } from "./login.usecase";
import { RegisterUseCase } from "./register.usecase";
import { LogoutUseCase } from "./logout.usecase";

export * from "./login.usecase";
export * from "./register.usecase";
export * from "./logout.usecase";

export const loginUseCase = new LoginUseCase(authRepository);
export const registerUseCase = new RegisterUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
