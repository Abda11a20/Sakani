import path from "node:path";
import { defineConfig, env } from "prisma/config";

// prisma.config.ts لـ HuggingFace و local development
// __dirname = المجلد الذي يحتوي هذا الملف
// في HuggingFace (subtree): /app  →  prisma/schema.prisma موجود في /app/prisma/
// في local (monorepo):      apps/backend  →  prisma/schema.prisma موجود في apps/backend/prisma/

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },

  datasource: {
    // env() هي دالة Prisma الرسمية لقراءة متغيرات البيئة في prisma.config.ts
    url: env("DATABASE_URL"),
  },
});
