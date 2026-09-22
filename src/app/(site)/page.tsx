import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  Database,
  ShieldCheck,
} from "lucide-react";

import { Hero } from "@/components/sections/hero";
import { LiveStatus } from "@/components/sections/live-status";
import { Story } from "@/components/sections/story";
import { ProjectCard } from "@/components/sections/project-card";
import { Reveal } from "@/components/ui/reveal";
import {
  Badge,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";

import { featuredProjects } from "@/content/projects";
import { experiences, experienceHighlights } from "@/content/experience";
import { skillGroups } from "@/content/skills";
import { services } from "@/content/freelance";
import { formatPeriod } from "@/lib/utils";

/** Icons for the four capability cards, keyed to skill group ids. */
const capabilityIcons = {
  genai: BrainCircuit,
  data: Database,
  backend: Boxes,
  ml: ShieldCheck,
} as const;

export default function HomePage() {
  const capabilityGroups = skillGroups.filter(
    (g): g is (typeof skillGroups)[number] & { id: keyof typeof capabilityIcons } =>
      g.id in capabilityIcons,
  );

  return (
    <>
      <Hero />

      {/* Live service status, read from /api/status in the browser. It owns
          its own spacing so it takes up no room until the fetch resolves. */}
      <LiveStatus />

      {/* ---------------------------------------------------------- Stats */}
      <Section className="py-12 sm:py-16">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border lg:grid-cols-4">
          {experienceHighlights.map((stat) => (
            <div key={stat.label} className="bg-surface px-5 py-7 sm:px-7">
              <dd className="text-2xl font-semibold text-accent sm:text-3xl">
                {stat.value}
              </dd>
              <dt className="mt-2 text-sm font-medium">{stat.label}</dt>
              <p className="mt-1 text-xs text-fg-subtle">{stat.note}</p>
            </div>
          ))}
        </dl>
      </Section>

      {/* ----------------------------------------------------- Capabilities */}
      <Section id="capabilities">
        <SectionHeading
          eyebrow="What I work on"
          title="From agent orchestration down to the retrieval layer"
          description="The work spans the whole stack of an AI system — routing and orchestration at the top, tool protocols and memory in the middle, graph and vector retrieval underneath, and evaluation across all of it."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {capabilityGroups.map((group, i) => {
            const Icon = capabilityIcons[group.id];
            return (
              <Reveal key={group.id} delay={i * 0.06}>
                <Card className="h-full p-6 sm:p-7">
                  <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
                    <Icon className="h-[1.15rem] w-[1.15rem]" />
                  </div>
                  <h3 className="text-base font-semibold">{group.label}</h3>
                  <p className="mt-1.5 text-sm text-fg-muted">{group.note}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {group.items.slice(0, 7).map((item) => (
                      <span
                        key={item}
                        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[0.7rem] text-fg-subtle"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8">
          <Link
            href="/about#skills"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
          >
            See the full technical stack
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Section>

      <Story />

      {/* -------------------------------------------------------- Projects */}
      <Section id="projects" className="border-y border-border bg-bg-subtle">
        <SectionHeading
          eyebrow="Selected work"
          title="Featured projects"
          description="Enterprise platforms, client retrieval systems and self-directed infrastructure work. Client projects are described at the level of detail that appears on my resume."
          action={
            <ButtonLink href="/projects" variant="secondary" size="sm">
              All projects
              <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          {featuredProjects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <ProjectCard project={project} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ Experience */}
      <Section id="experience">
        <SectionHeading
          eyebrow="Experience"
          title="Where I have worked"
          action={
            <ButtonLink href="/experience" variant="secondary" size="sm">
              Full timeline
              <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          }
        />

        <div className="space-y-4">
          {experiences.map((exp, i) => (
            <Reveal key={exp.slug} delay={i * 0.06}>
              <Card
                as={Link}
                href={`/experience#${exp.slug}`}
                interactive
                className="block p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-semibold">{exp.company}</h3>
                      {exp.current ? <Badge tone="success">Current</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-accent">{exp.role}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-xs text-fg-subtle">
                      {formatPeriod(exp.start, exp.end)}
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {exp.employmentType}
                      {exp.duration ? ` · ${exp.duration}` : ""}
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-fg-muted">
                  {exp.summary}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {exp.tech.slice(0, 8).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[0.7rem] text-fg-subtle"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Freelance */}
      <Section id="freelance" className="border-t border-border bg-bg-subtle">
        <SectionHeading
          eyebrow="Open to freelancing"
          title="Available for selected AI/ML projects"
          description="Taking on a small number of engagements alongside full-time work — which means I am selective, and honest about timelines before we start."
          action={
            <ButtonLink href="/freelance#inquiry" size="sm">
              Start a project
              <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service, i) => (
            <Reveal key={service.id} delay={i * 0.05}>
              <Card className="h-full p-6">
                <h3 className="text-base font-semibold">{service.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {service.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- Contact */}
      <Section>
        <Card className="relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full opacity-60 blur-[100px]"
            style={{
              background: "radial-gradient(closest-side, var(--glow), transparent 75%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Have an AI problem worth solving?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-fg-muted">
              Whether you are hiring, scoping a freelance build, or just want to
              compare notes on agent architecture — the inbox is open.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact" size="lg">
                Get in touch
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/about" variant="secondary" size="lg">
                More about me
              </ButtonLink>
            </div>
          </div>
        </Card>
      </Section>
    </>
  );
}
