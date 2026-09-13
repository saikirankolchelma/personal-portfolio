import type { Metadata } from "next";
import { ArrowRight, Award, GraduationCap, Briefcase, Sparkles } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import {
  Badge,
  BulletList,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";

import { profile, education, certifications } from "@/content/profile";
import { journey, focusNow, goals, personalInterests } from "@/content/about";
import { skillGroups } from "@/content/skills";

export const metadata: Metadata = {
  title: "About",
  description: `About ${profile.name} — ${profile.titleLong}. Career journey, technical background, education and what I am working on now.`,
  alternates: { canonical: "/about" },
};

const journeyIcon = {
  education: GraduationCap,
  work: Briefcase,
  learning: Sparkles,
} as const;

export default function AboutPage() {
  return (
    <>
      {/* ----------------------------------------------------------- Intro */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              About
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              From a data science degree to building agentic systems in
              production.
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              {profile.summary}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/experience">
                See my experience
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Get in touch
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Journey */}
      <Section id="journey">
        <SectionHeading
          eyebrow="Career journey"
          title="How I got here"
          description="Three stages, and the thing each one taught me."
        />

        <div className="relative">
          {/* Timeline rail — hidden on mobile where the cards stack full-width. */}
          <div
            aria-hidden
            className="absolute left-[1.125rem] top-2 hidden h-[calc(100%-1rem)] w-px bg-border sm:block"
          />

          <div className="space-y-6">
            {journey.map((stage, i) => {
              const Icon = journeyIcon[stage.kind];
              return (
                <Reveal key={stage.title} delay={i * 0.07}>
                  <div className="sm:flex sm:gap-7">
                    <div
                      aria-hidden
                      className="relative hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-accent sm:grid"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <Card className="flex-1 p-6 sm:p-7">
                      <p className="font-mono text-xs text-fg-subtle">
                        {stage.period}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">{stage.title}</h3>
                      <p className="mt-0.5 text-sm text-accent">{stage.subtitle}</p>
                      <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                        {stage.body}
                      </p>
                    </Card>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------- Focus areas */}
      <Section className="border-y border-border bg-bg-subtle">
        <SectionHeading
          eyebrow="Current focus"
          title="What I am thinking about right now"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {focusNow.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <Card className="h-full p-6 sm:p-7">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {item.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- Skills */}
      <Section id="skills">
        <SectionHeading
          eyebrow="Technical background"
          title="The full stack I work across"
          description="Grouped the way I actually use them, rather than as one undifferentiated list."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {skillGroups.map((group, i) => (
            <Reveal key={group.id} delay={i * 0.05}>
              <Card className="h-full p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-base font-semibold">{group.label}</h3>
                  <span className="font-mono text-xs text-fg-subtle">
                    {group.items.length}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-fg-muted">{group.note}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
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
          ))}
        </div>
      </Section>

      {/* ------------------------------------ Education + certifications */}
      <Section className="border-y border-border bg-bg-subtle">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading eyebrow="Education" title="Academic background" className="mb-8" />
            <div className="space-y-4">
              {education.map((edu) => (
                <Card key={edu.institution} className="p-6 sm:p-7">
                  <p className="font-mono text-xs text-fg-subtle">{edu.period}</p>
                  <h3 className="mt-2 text-base font-semibold">{edu.degree}</h3>
                  <p className="mt-0.5 text-sm text-accent">{edu.specialization}</p>
                  <p className="mt-3 text-sm text-fg-muted">{edu.institution}</p>
                  <p className="mt-1 text-sm text-fg-subtle">{edu.location}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Certifications & achievements"
              title="Credentials"
              className="mb-8"
            />
            <div className="space-y-3">
              {certifications.map((cert) => (
                <Card key={cert.name} className="flex items-start gap-4 p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent-soft text-accent">
                    <Award className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{cert.name}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">{cert.issuer}</p>
                  </div>
                  {cert.type === "achievement" ? (
                    <Badge tone="accent" className="ml-auto shrink-0">
                      Achievement
                    </Badge>
                  ) : null}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Goals */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Professional goals"
              title="Where I am pointed next"
              className="mb-8"
            />
            <BulletList items={goals} />
          </div>

          {personalInterests.length > 0 ? (
            <div>
              <SectionHeading eyebrow="Outside work" title="Personal interests" className="mb-8" />
              <div className="flex flex-wrap gap-2">
                {personalInterests.map((interest) => (
                  <Badge key={interest.label}>{interest.label}</Badge>
                ))}
              </div>
            </div>
          ) : (
            <Card className="flex flex-col justify-center p-8">
              <h3 className="text-base font-semibold">Curious about the rest?</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The AI Lab page covers what I am reading, experimenting with and
                learning outside of shipped work — including the areas I am
                still exploring rather than claiming.
              </p>
              <ButtonLink href="/ai-lab" variant="secondary" size="sm" className="mt-6 w-fit">
                Visit the AI Lab
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            </Card>
          )}
        </div>
      </Section>
    </>
  );
}
