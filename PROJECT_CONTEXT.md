# 🤖 Sakany (سكني) - AI Assistant & Developer Context Reference (`PROJECT_CONTEXT.md`)

> **Note for AI Coding Assistants (Antigravity, Claude, ChatGPT, Copilot, Cursor):**
> This document contains the definitive, authoritative context for the **Sakany (سكني)** monorepo codebase. You **MUST** read and adhere to all architectural constraints, local environment variables, database adapters, and i18n rules documented here before proposing or generating any code edits.

---

## 📌 1. Project Quick Matrix

| Attribute | Configuration Detail |
| :--- | :--- |
| **Project Name** | Sakany (سكني) - Egyptian Housing & Shared Bed Rental Platform |
| **Monorepo Engine** | Turborepo (`npm` workspaces) |
| **Frontend Server** | Next.js 14.2 App Router (Runs on `http://localhost:3000`) |
| **Backend Server** | NestJS 10.0 Monolith (Runs on `http://localhost:4000`) |
| **Database** | PostgreSQL 16 (`localhost:5432` / `sakani_db`) |
| **Prisma Config** | Prisma ORM 5/7 with `@prisma/adapter-pg` driven by `prisma.config.ts` |
| **CLI Command Flag** | `npm run dev -- --env-mode=loose` (Mandatory on Windows) |
| **Locales Supported** | Arabic (`ar` - Default / RTL) and English (`en` - LTR) via `next-intl` |

---

## 🛠️ 2. Environment & Database Configuration

### 2.1 Database Connection String (`apps/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/sakani_db?schema=public"
PORT=4000
JWT_SECRET="super-secret-jwt-key"
JWT_REFRESH_SECRET="super-secret-refresh-key"
```

### 2.2 Prisma Adapter Configuration (`apps/backend/prisma.config.ts`)
```typescript
import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url: process.env.DATABASE_URL! },
  migrate: {
    async adapter() {
      return new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      })
    },
  },
})
```

---

## 🚨 3. Mandatory AI Coding Rules & Constraints

When modifying or generating code for this repository, AI agents **MUST** enforce the following rules:

### Rule 1: Zero Hardcoded Translatable UI Strings
- **NEVER** write plain Arabic or English user-facing text inside JSX/TSX components.
- Always use `useTranslations("namespace")` from `next-intl`.
- Add new keys symmetrically to both `apps/frontend/messages/ar.json` and `apps/frontend/messages/en.json`.
- Reuse existing keys under `common.status.*`, `common.unit.*`, and `common.actions.*` whenever possible.

### Rule 2: Zero Unsanctioned Backend / Database Breaking Changes
- **NEVER** modify NestJS API DTO signatures, endpoint routes, or Prisma model column names without explicit user request.
- Always run `npx prisma migrate dev` after altering `schema.prisma`.

### Rule 3: Strict TypeScript & Type Imports
- **NEVER** use `any` in core domain services, hooks, or component props.
- Import shared types from `@/types` or `@sakani/types`.

### Rule 4: RTL/LTR Layout & Directional Hygiene
- Use Next.js locale context `dir={isAr ? "rtl" : "ltr"}`.
- Use Tailwind CSS logical properties: `ps-*` (padding-start), `pe-*` (padding-end), `start-*`, `end-*`, `ms-*`, `me-*`.

---

## 📁 4. Core Entry Points & File Map

### 4.1 Frontend Map (`apps/frontend/`)
- `messages/ar.json` & `messages/en.json` — i18n Translation Dictionaries.
- `src/app/[locale]/layout.tsx` — NextIntl Client Provider & Global Theme Root.
- `src/app/[locale]/page.tsx` — Public Home Landing Page.
- `src/app/[locale]/search/page.tsx` — Interactive Discovery & Map Search Engine.
- `src/app/[locale]/dashboard/landlord/` — Landlord Management System (Ads, Beds, Requests).
- `src/app/[locale]/dashboard/tenant/` — Tenant Portal (Viewing Requests, Wishlist, Alerts).
- `src/app/[locale]/dashboard/support/` — Realtime Support Chat Room.
- `src/app/[locale]/admin/` — Platform Moderation, Verifications & Banned Users Index.
- `src/services/api.ts` — Unified Axios Instance with HTTP-Only Cookie Refresh Interceptors.

### 4.2 Backend Map (`apps/backend/`)
- `src/main.ts` — NestJS Bootstrap Entry (ValidationPipes, CORS, CookieParsers).
- `prisma/schema.prisma` — Master PostgreSQL Entity Definitions & Enums.
- `src/auth/` — JWT Strategy, Passport Auth, Refresh Token Handlers, Roles Guards.
- `src/listings/` — Apartment & Bed Listing CRUD Controllers.
- `src/requests/` — Viewing Request Workflow & Rental Contract Generators.
- `src/chat/` — Pusher Realtime WebSocket Broadcasters.
- `src/uploads/` — Cloudinary REST Upload Signer.

---

## ⚙️ 5. Common Maintenance Commands

```bash
# Start full stack development server (Windows loose mode)
npm run dev

# Run TypeScript compilation check across frontend
cd apps/frontend && npx tsc --noEmit

# Run Prisma DB Migration & Seed
cd apps/backend && npx prisma migrate dev && npx prisma db seed

# Launch Next.js frontend only
npm run dev:frontend

# Launch NestJS backend only
npm run dev:backend
```

---

## 🏆 6. Development Status Summary

- [x] **Turborepo Monorepo Architecture:** Next.js 14 + NestJS + Prisma 5/7 + PostgreSQL 16.
- [x] **RBAC Authentication:** User Roles (`tenant`, `landlord`, `admin`, `super_admin`), JWT Access Tokens, Refresh Token Cookies.
- [x] **i18n Localization (100% Verified):** Clean bilingual `ar`/`en` dictionaries, dynamic frontend notification mapping, zero TypeScript errors (`tsc --noEmit` pass with 0 errors).
- [x] **Property & Bed Matrix Listing:** Landlords manage full apartments and individual bed occupancies.
- [x] **Realtime Support Chat:** Live support channels powered by Pusher WebSockets.
- [x] **Admin Moderation & Lifecycle:** Listing verifications, banned user indices, and self-deactivation grace period trackers.
