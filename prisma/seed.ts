import { config } from "dotenv";

// Next.js loads `.env.local` itself, but a standalone CLI script does not —
// plain `dotenv/config` only reads `.env`. Load both, most-specific first;
// dotenv does not overwrite already-set variables, so `.env.local` wins.
config({ path: ".env.local" });
config({ path: ".env" });
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Creates (or updates) the single owner account from environment variables.
 *
 * There is no sign-up route in the app — this script is the only way an
 * account comes into existence. Re-running it rotates the password rather
 * than creating a second user.
 */

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;

  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  if (!email || !password) {
    throw new Error(
      "OWNER_EMAIL and OWNER_PASSWORD must both be set in .env.local before seeding.",
    );
  }
  if (password.length < 12) {
    throw new Error(
      "OWNER_PASSWORD must be at least 12 characters. This is the only account on the dashboard.",
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const telegramId = process.env.TELEGRAM_ALLOWED_USER_ID?.trim() || null;

    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, telegramId },
      create: {
        email,
        passwordHash,
        telegramId,
        name: "Kolchelma Sai Kiran",
      },
    });

    console.log(`Owner account ready: ${user.email}`);

    // A couple of starter buckets so the dashboard is not empty on first run.
    for (const project of [
      { name: "Enterprise AI Platform", slug: "enterprise-ai-platform", context: "Avira Digital" },
      { name: "Learning & Research", slug: "learning-research", context: "personal" },
      { name: "Freelance", slug: "freelance", context: "client work" },
    ]) {
      await prisma.workProject.upsert({
        where: { userId_slug: { userId: user.id, slug: project.slug } },
        update: {},
        create: { ...project, userId: user.id },
      });
    }

    console.log("Starter projects ready.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
