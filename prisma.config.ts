import "dotenv/config";
import { defineConfig } from "@prisma/config";

/**
 * Prisma 7 moved connection URLs out of schema.prisma and into this file.
 * The CLI reads it for migrate/introspect; the runtime client connects
 * through the pg driver adapter in src/lib/db.ts instead.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Pooled connection string (Neon pooler / Vercel Postgres).
    url: process.env.DATABASE_URL ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
