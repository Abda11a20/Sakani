# apps/backend/Dockerfile
# مخصص لـ HuggingFace Spaces - يستمع على port 7860

# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Stage 2: Production Dependencies (بدون devDependencies) ─────────────────
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# ─── Stage 3: Build ───────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .

# DATABASE_URL مؤقت فقط لتوليد Prisma client أثناء البناء
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# توليد Prisma client (prisma.config.ts يشير لـ ./prisma/schema.prisma)
RUN npx prisma generate

# بناء تطبيق NestJS
RUN npm run build

# ─── Stage 4: Runner (Production) ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
# HuggingFace Spaces تشترط port 7860
ENV PORT=7860
EXPOSE 7860

# نسخ node_modules (production فقط)
COPY --from=deps /app/node_modules ./node_modules

# نسخ الكود المبني
COPY --from=builder /app/dist ./dist

# نسخ Prisma schema + migrations (للـ migrate deploy عند الstart)
COPY --from=builder /app/prisma ./prisma

# نسخ Prisma client المولّد
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# مستخدم غير root للأمان
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
USER nestjs

# تشغيل migrations ثم بدء السيرفر
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]