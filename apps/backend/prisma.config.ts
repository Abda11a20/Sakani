import path from "node:path";
import { defineConfig, env } from "prisma/config";

// عند رفع الباك إند كـ subtree على HuggingFace،
// الملفات تكون في root مباشرة (مش apps/backend/)
// لذا المسارات نسبية من __dirname

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
