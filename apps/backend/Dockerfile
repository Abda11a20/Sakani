# apps/backend/Dockerfile

# ─── Stage 1: Base ───────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Stage 2: Production Dependencies ────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# ─── Stage 3: Build ──────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .

# 💡 تم إضافة هذا السطر لحل مشكلة البناء في هجينج فيس
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client before building
RUN npx prisma generate
RUN npm run build

# ─── Stage 4: Runner (Production) ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy built output
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + migrations (needed for migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 3001

CMD ["node", "dist/src/main"]