import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Next 16 renamed Middleware to Proxy; the behaviour is unchanged.
 *
 * This is an optimistic gate only — it keeps unauthenticated visitors off the
 * dashboard UI. Every route that reads private data re-checks the session
 * server-side, because a proxy check alone is not an authorization boundary.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const signedIn = Boolean(request.auth);
  const onDashboard = nextUrl.pathname.startsWith("/dashboard");
  const onLogin = nextUrl.pathname === "/login";

  if (onDashboard && !signedIn) {
    const url = new URL("/login", nextUrl);
    // Send them back where they were headed once they sign in.
    url.searchParams.set("next", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (onLogin && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
