import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Wrench } from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui/primitives";
import { games, tools } from "@/content/play";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Games and productivity tools — Tic-Tac-Toe against a minimax opponent, Snake, and a Pomodoro focus timer.",
  alternates: { canonical: "/play" },
};

function ItemGrid({ items }: { items: typeof games }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.slug} interactive className="group relative p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
              {item.kind === "game" ? (
                <Gamepad2 className="h-[1.1rem] w-[1.1rem]" />
              ) : (
                <Wrench className="h-[1.1rem] w-[1.1rem]" />
              )}
            </div>
            <ArrowUpRight
              aria-hidden
              className="h-5 w-5 text-fg-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </div>

          <h3 className="mt-5 text-lg font-semibold">
            <Link href={`/play/${item.slug}`} className="after:absolute after:inset-0">
              {item.name}
            </Link>
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{item.blurb}</p>
          <p className="mt-4 font-mono text-xs text-fg-subtle">{item.meta}</p>
        </Card>
      ))}
    </div>
  );
}

export default function PlayPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Play
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Games & tools
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              A few things built for fun and for focus. Everything here runs
              entirely in your browser — no accounts, no tracking, nothing sent
              anywhere.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Games" title="Something to play" />
        <ItemGrid items={games} />
      </Section>

      <Section className="border-t border-border bg-bg-subtle">
        <SectionHeading eyebrow="Tools" title="Something to get work done" />
        <ItemGrid items={tools} />
      </Section>
    </>
  );
}
