"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db";

export type LoginState = { error: string | null };

/**
 * Sign-in server action.
 *
 * Every failure returns the same generic message. Distinguishing "no such
 * account" from "wrong password" would turn this into an account-enumeration
 * oracle, and there is exactly one account to guess at.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isDatabaseConfigured()) {
    return {
      error:
        "The dashboard database is not configured yet. Set DATABASE_URL and run the seed script.",
    };
  }

  const next = String(formData.get("next") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Only same-origin paths, so `next` cannot become an open redirect.
      redirectTo: next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    // signIn throws a redirect on success — let Next handle it.
    throw error;
  }

  return { error: null };
}
