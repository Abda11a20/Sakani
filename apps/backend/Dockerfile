# apps/backend/Dockerfile
# مخصص لـ HuggingFace Spaces - يستمع على port 7860

# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Stage 2: Production Dependencies ────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
# --ignore-scripts يمنع postinstall scripts لكن نحتاج prisma engines لذلك لا نضعه هنا
RUN npm install --omit=dev

# ─── Stage 3: Build ──────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .

# DATABASE_URL مؤقت لتوليد Prisma client أثناء البناء فقط
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# توليد Prisma client - prisma.config.ts يشير لـ ./prisma/schema.prisma
RUN npx prisma generate

# بناء تطبيق NestJS
RUN npm run build

# ─── Stage 4: Runner (Production) ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# إنشاء مستخدم غير root قبل نسخ الملفات
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# إنشاء مجلد logs ومنح الصلاحيات لـ nestjs قبل التبديل للمستخدم
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

# نسخ node_modules (production)
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# نسخ Prisma client المولّد (الـ engines الثنائية)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# نسخ @prisma/engines من builder (يحتوي engines مولّدة بشكل صحيح)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# نسخ الكود المبني
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# نسخ Prisma schema + migrations
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# *** مهم: نسخ prisma.config.ts للـ runner حتى يعمل prisma migrate deploy ***
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nestjs

# تشغيل migrations ثم بدء السيرفر
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]