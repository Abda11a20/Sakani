// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/client.ts
// يعيد تصدير الـ axios instance الموجود بدون أي تغيير عليه.
// الـ interceptors والـ token refresh والـ mapListingTypes تظل تعمل كما هي.
export { api as apiClient, default } from "@/lib/api";
