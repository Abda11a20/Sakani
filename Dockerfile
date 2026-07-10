# Dockerfile
# هذا الملف مخصص لبناء الباك إند وتشغيله على منصة Hugging Face Spaces
# يستمع السيرفر تلقائياً على بورت 7860 كما تطلب المنصة

# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Stage 2: Dependencies ───────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
# تثبيت الاعتماديات بدون تشغيل اسكريبتات إضافية
RUN npm ci --ignore-scripts

# ─── Stage 3: Build ──────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci
COPY . .
# توليد عميل Prisma باستخدام مسار المخطط الصحيح
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
# بناء تطبيق NestJS الباك إند
RUN npm run build --workspace=backend

# ─── Stage 4: Runner ──────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
# تعيين البورت ليكون 7860 كما تشترط Hugging Face Spaces
ENV PORT=7860
EXPOSE 7860

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# تشغيل الباك إند
CMD ["node", "apps/backend/dist/src/main"]
