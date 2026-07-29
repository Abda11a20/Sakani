// apps/frontend/src/features/admin/index.ts
/**
 * Admin Feature — Public API Barrel Export (Clean Architecture)
 */
export * from "./domain/repositories/admin.repository";
export * from "./domain/usecases/get-admin-stats.usecase";
export * from "./infrastructure/repositories/axios-admin.repository";
