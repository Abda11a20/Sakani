import path from "node:path";
import { defineConfig, env } from "prisma/config";

// prisma.config.ts للتطوير المحلي وبيئات النشر
// __dirname = المجلد الذي يحتوي هذا الملف
// schema.prisma موجود بجانب هذا الملف داخل apps/backend/prisma/

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
