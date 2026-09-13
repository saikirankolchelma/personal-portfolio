import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/ui/primitives";
import { getPlayItem } from "@/content/play";

export function PlayShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const item = getPlayItem(slug);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-12 sm:py-16">
          <Link
            href="/play"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All games & tools
          </Link>
          <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{item?.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
            {item?.blurb}
          </p>
        </div>
      </section>

      <Section className="py-10 sm:py-14">{children}</Section>
    </>
  );
}
