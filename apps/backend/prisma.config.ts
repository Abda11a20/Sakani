import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// تحميل متغيرات البيئة من ملف .env المحلي إن وجد
config({
  path: path.join(__dirname, ".env"),
});

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },

  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
