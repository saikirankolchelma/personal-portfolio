import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";
import { navItems } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="container-px relative flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
          This page does not exist
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-fg-muted">
          The link may be outdated, or the page may have moved. Here is the way
          back.
        </p>

        <ButtonLink href="/" className="mt-9">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </ButtonLink>

        <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Site">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
