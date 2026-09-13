import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Resolves the signed-in owner, or leaves.
 *
 * `proxy.ts` already redirects unauthenticated visitors away from /dashboard,
 * but that is an optimistic UI gate, not an authorization boundary. Every
 * function that touches private data calls this, so a route reached by any
 * other path still cannot read anything.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
