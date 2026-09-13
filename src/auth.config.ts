import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the auth configuration.
 *
 * This file must not import Prisma, bcrypt, or anything else with a Node
 * dependency, because `proxy.ts` runs it in the Edge runtime. The credential
 * check itself lives in `auth.ts`, which is Node-only.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Owner-only dashboard; a long session avoids constant re-login without
    // leaving a token valid indefinitely.
    maxAge: 60 * 60 * 24 * 14,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
