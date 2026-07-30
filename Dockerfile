# Dockerfile
# مخصص لـ Railway - يستمع على البورت الذي يحدده Railway تلقائياً

# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Stage 2: Dependencies ───────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --ignore-scripts

# ─── Stage 3: Build ──────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci
COPY . .
# DATABASE_URL مؤقت لتوليد Prisma client أثناء البناء فقط
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
# توليد عميل Prisma
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
# بناء تطبيق NestJS
RUN npm run build --workspace=backend

# ─── Stage 4: Runner (Production) ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
# Railway يحدد PORT تلقائياً - الافتراضي 3001
ENV PORT=3001
EXPOSE 3001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# تشغيل migrations ثم بدء السيرفر
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node apps/backend/dist/src/main"]
