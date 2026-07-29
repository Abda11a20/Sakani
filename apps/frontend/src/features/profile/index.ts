// apps/frontend/src/features/profile/index.ts
/**
 * Profile Feature — Public API Barrel Export (Clean Architecture)
 */
export * from "./domain/repositories/profile.repository";
export * from "./domain/usecases/get-profile.usecase";
export * from "./infrastructure/repositories/axios-profile.repository";
export * from "./hooks/useProfile";
