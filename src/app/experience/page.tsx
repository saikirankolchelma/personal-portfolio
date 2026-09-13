import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import {
  Badge,
  BulletList,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";

import { experiences, experienceHighlights } from "@/content/experience";
import { education } from "@/content/profile";
import { projects } from "@/content/projects";
import { formatPeriod } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Professional experience as an AI/ML Engineer — enterprise agentic AI platforms, clinical Graph RAG, multi-agent data structuring and BI migration automation.",
  alternates: { canonical: "/experience" },
};

export default function ExperiencePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Experience
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Enterprise AI, from the orchestration layer down
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              A full-time AI/ML engineering role and an AI engineering
              internship — agent platforms, retrieval systems and automation
              pipelines. Client work is described at the level of detail that
              appears on my resume.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border lg:grid-cols-4">
            {experienceHighlights.map((stat) => (
              <div key={stat.label} className="bg-surface px-5 py-6">
                <dd className="text-xl font-semibold text-accent sm:text-2xl">
                  {stat.value}
                </dd>
                <dt className="mt-1.5 text-sm font-medium">{stat.label}</dt>
                <p className="mt-1 text-xs text-fg-subtle">{stat.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section>
        <div className="space-y-8">
          {experiences.map((exp, expIndex) => (
            <Reveal key={exp.slug} delay={expIndex * 0.05}>
              {/* scroll-mt clears the sticky header when linked with #slug */}
              <Card id={exp.slug} className="scroll-mt-28 overflow-hidden">
                {/* ---------------------------------------------- header */}
                <div className="border-b border-border bg-surface-2/50 p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-semibold sm:text-2xl">
                          {exp.role}
                        </h2>
                        {exp.current ? <Badge tone="success">Current</Badge> : null}
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                        <span className="flex items-center gap-1.5 font-medium text-accent">
                          <Building2 className="h-3.5 w-3.5" aria-hidden />
                          {exp.company}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {exp.location}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="font-mono text-sm text-fg">
                        {formatPeriod(exp.start, exp.end)}
                      </p>
                      <p className="mt-1 text-xs text-fg-subtle">
                        {exp.employmentType}
                        {exp.duration ? ` · ${exp.duration}` : ""}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 max-w-3xl text-sm leading-relaxed text-fg-muted">
                    {exp.summary}
                  </p>
                </div>

                {/* ------------------------------------------ workstreams */}
                <div className="divide-y divide-border">
                  {exp.workstreams.map((ws) => {
                    // Link through to the project page when one exists.
                    const related = projects.find(
                      (p) =>
                        p.name === ws.name ||
                        p.name.endsWith(ws.name) ||
                        ws.name.startsWith(p.name.split(" — ")[0]),
                    );

                    return (
                      <div key={ws.name} className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-semibold">{ws.name}</h3>
                          {ws.client ? <Badge tone="outline">{ws.client}</Badge> : null}
                        </div>

                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-subtle">
                          {ws.context}
                        </p>

                        <BulletList items={ws.bullets} className="mt-5" />

                        {related ? (
                          <Link
                            href={`/projects/${related.slug}`}
                            className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
                          >
                            Read the full project breakdown
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* -------------------------------------------------- tech */}
                <div className="border-t border-border bg-surface-2/50 p-6 sm:px-8">
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                    Technologies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.tech.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-[0.7rem] text-fg-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ Education */}
      <Section className="border-t border-border bg-bg-subtle">
        <SectionHeading eyebrow="Education" title="Academic background" />
        <div className="grid gap-5 sm:grid-cols-2">
          {education.map((edu) => (
            <Card key={edu.institution} className="p-6 sm:p-7">
              <p className="font-mono text-xs text-fg-subtle">{edu.period}</p>
              <h3 className="mt-2 text-base font-semibold">{edu.degree}</h3>
              <p className="mt-0.5 text-sm text-accent">{edu.specialization}</p>
              <p className="mt-3 text-sm text-fg-muted">{edu.institution}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/projects">
            Explore the projects
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Get in touch
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
