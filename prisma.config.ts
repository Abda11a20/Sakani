import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const backendEnvPath = path.resolve(__dirname, "apps", "backend", ".env");

config({
  path: fs.existsSync(backendEnvPath) ? backendEnvPath : path.resolve(__dirname, ".env"),
});

const schemaPath = path.resolve(__dirname, "apps", "backend", "prisma", "schema.prisma");
console.log("PRISMA CONFIG RESOLVED SCHEMA PATH:", schemaPath);

export default defineConfig({
  schema: schemaPath,

  migrations: {
    path: path.resolve(__dirname, "apps", "backend", "prisma", "migrations"),
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
