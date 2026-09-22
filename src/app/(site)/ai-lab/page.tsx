import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import {
  Badge,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";

import { interestAreas, levelMeta, type InterestLevel } from "@/content/ai-lab";
import { getProject } from "@/content/projects";

export const metadata: Metadata = {
  title: "AI Lab",
  description:
    "Exploring the future of intelligent systems — agent optimization, retrieval, evaluation, AI security, fine-tuning and inference infrastructure.",
  alternates: { canonical: "/ai-lab" },
};

const levelTone: Record<InterestLevel, "success" | "accent" | "outline"> = {
  applied: "success",
  "hands-on": "accent",
  exploring: "outline",
};

export default function AiLabPage() {
  const grouped = (["applied", "hands-on", "exploring"] as const).map((level) => ({
    level,
    areas: interestAreas.filter((a) => a.level === level),
  }));

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-8rem] h-80 w-[44rem] -translate-x-1/2 rounded-full opacity-60 blur-[110px]"
          style={{
            background: "radial-gradient(closest-side, var(--glow), transparent 75%)",
          }}
        />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              AI Lab
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Exploring the future of intelligent systems
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              The areas I work in, experiment with, and am still learning —
              labeled honestly. Some of this is shipped in production. Some of it
              is a weekend project. Some of it I am only reading about, and it
              says so.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/ai-lab/retrieval-playground"
              className="group flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-accent/30 bg-accent-soft p-5 transition-colors hover:border-accent/50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-surface text-accent">
                <FlaskConical className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-fg">
                  Try the Retrieval Playground
                </span>
                <span className="mt-1 block text-sm text-fg-muted">
                  Real chunking and BM25 scoring on your own text — and the
                  question that breaks it.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Legend — makes the honesty of the labels explicit up front. */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {(Object.keys(levelMeta) as InterestLevel[]).map((level) => (
              <div
                key={level}
                className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4"
              >
                <Badge tone={levelTone[level]} className="mt-0.5 shrink-0">
                  {levelMeta[level].label}
                </Badge>
                <p className="text-xs leading-relaxed text-fg-subtle">
                  {levelMeta[level].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {grouped.map(({ level, areas }, groupIndex) =>
        areas.length > 0 ? (
          <Section
            key={level}
            className={groupIndex % 2 === 1 ? "border-y border-border bg-bg-subtle" : undefined}
          >
            <SectionHeading
              eyebrow={levelMeta[level].label}
              title={
                level === "applied"
                  ? "Shipped in production work"
                  : level === "hands-on"
                    ? "Built in self-directed projects"
                    : "Actively learning"
              }
              description={levelMeta[level].description}
            />

            <div className="grid gap-5 md:grid-cols-2">
              {areas.map((area, i) => (
                <Reveal key={area.id} delay={i * 0.05}>
                  <Card className="flex h-full flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold">{area.title}</h3>
                      <Badge tone={levelTone[area.level]} className="shrink-0">
                        {area.level}
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                      {area.blurb}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {area.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[0.7rem] text-fg-subtle"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    {area.relatedProjects.length > 0 ? (
                      <div className="mt-auto pt-6">
                        <p className="mb-2.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-subtle">
                          Where it shows up
                        </p>
                        <ul className="space-y-1.5">
                          {area.relatedProjects.map((slug) => {
                            const project = getProject(slug);
                            if (!project) return null;
                            return (
                              <li key={slug}>
                                <Link
                                  href={`/projects/${slug}`}
                                  className="inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
                                >
                                  {project.name}
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </Card>
                </Reveal>
              ))}
            </div>
          </Section>
        ) : null,
      )}

      <Section className="border-t border-border">
        <Card className="px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Working on something in one of these areas?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fg-muted">
            I take on a small number of freelance engagements, and I am always up
            for comparing notes on agent architecture and retrieval design.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/freelance">
              Freelance services
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Get in touch
            </ButtonLink>
          </div>
        </Card>
      </Section>
    </>
  );
}
