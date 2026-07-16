// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/index.ts
// نقطة دخول واحدة لجميع API modules
// الاستخدام: import { authApi, listingsApi } from "@/lib/api"
// ملاحظة: لا يتعارض مع @/lib/api (الـ axios instance) — هذا مجلد مختلف

export { authApi }     from "./auth.api";
export { listingsApi } from "./listings.api";
export { bedsApi }     from "./beds.api";
export { requestsApi } from "./requests.api";
export { reviewsApi }  from "./reviews.api";
export { uploadsApi }  from "./uploads.api";
export { alertsApi }   from "./alerts.api";
export { adminApi }    from "./admin.api";
export { usersApi }    from "./users.api";
