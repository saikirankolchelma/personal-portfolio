import { config } from "dotenv";

// Next.js loads `.env.local` itself, but a standalone CLI script does not —
// plain `dotenv/config` only reads `.env`. Load both, most-specific first;
// dotenv does not overwrite already-set variables, so `.env.local` wins.
config({ path: ".env.local" });
config({ path: ".env" });
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
    seed: "tsx prisma/seed.ts",
  },
});
