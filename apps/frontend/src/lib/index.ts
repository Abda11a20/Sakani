// apps/frontend/src/lib/index.ts
// Infrastructure layer — barrel export for the shared lib
// Import from specific modules for tree-shaking:
//   import { formatPrice } from '@/lib/formatters'
// Or import everything from here:
//   import { formatPrice, TOKEN_KEY, getAvatarData } from '@/lib'

export * from "./constants";
export * from "./formatters";
export * from "./helpers";
// utils re-exported selectively to avoid conflicts with formatters (e.g. formatDate, formatPrice)
export { cn, getImageUrl, getAvatarUrl } from "./utils";
