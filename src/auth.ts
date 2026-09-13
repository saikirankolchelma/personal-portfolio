import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma, isDatabaseConfigured } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/**
 * Single-owner credentials auth.
 *
 * There is no sign-up route and no registration flow — the one account is
 * created by `npm run db:seed`. `authorize` returns null for every failure
 * mode with no distinction between "no such user" and "wrong password", so
 * the endpoint cannot be used to enumerate accounts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        if (!isDatabaseConfigured()) return null;

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        // Compare against a dummy hash when the user is missing so the
        // response time does not reveal whether the account exists.
        const hash = user?.passwordHash ?? bcrypt.hashSync("unused", 10);
        const ok = await bcrypt.compare(password, hash);

        if (!user || !ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
  ],
});
