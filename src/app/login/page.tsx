import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { LoginForm } from "@/components/dashboard/login-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Private dashboard access.",
  // Never index the login page.
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const raw = params.next;
  const next = typeof raw === "string" && raw.startsWith("/") ? raw : "/dashboard";

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-[34rem] -translate-x-1/2 rounded-full opacity-50 blur-[110px]"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent 75%)" }}
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>

        <Card className="p-7 sm:p-8">
          <div className="mb-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
              <Lock className="h-[1.1rem] w-[1.1rem]" />
            </span>
            <h1 className="mt-5 text-xl font-semibold">Private dashboard</h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              Owner access only. There is no sign-up.
            </p>
          </div>

          <LoginForm next={next} />
        </Card>
      </div>
    </div>
  );
}
