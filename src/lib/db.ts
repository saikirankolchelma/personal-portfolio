import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 connects through a driver adapter rather than a schema-level URL.
 * The pg adapter works against Neon, Vercel Postgres and a local Postgres
 * alike, so there is one code path for every environment.
 *
 * The client is created lazily, on first property access. Building the app
 * without a DATABASE_URL is legitimate — the public portfolio is entirely
 * static — so merely importing this module must not throw. Routes that need
 * the database check `isDatabaseConfigured()` first and degrade gracefully.
 *
 * The instance is cached on globalThis so Next's dev-time module reloading
 * does not open a new connection pool on every edit.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createClient();
    // In production a module-scoped constant would do, but caching in both
    // environments keeps a single pool per process either way.
    globalForPrisma.prisma = client;
  }
  return globalForPrisma.prisma;
}

/**
 * Behaves exactly like a PrismaClient, but defers construction until the
 * first property is touched.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getClient(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});

/** True when a database connection string is configured at all. */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
