import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const backendEnvPath = path.join("apps", "backend", ".env");

config({
  path: fs.existsSync(backendEnvPath) ? backendEnvPath : path.join(".env"),
});

export default defineConfig({
  schema: path.join("apps", "backend", "prisma", "schema.prisma"),

  migrations: {
    path: path.join("apps", "backend", "prisma", "migrations"),
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
