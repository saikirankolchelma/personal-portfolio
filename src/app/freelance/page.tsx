import type { Metadata } from "next";
import { CheckCircle2, Clock, Users } from "lucide-react";

import { InquiryForm } from "@/components/sections/inquiry-form";
import { Reveal } from "@/components/ui/reveal";
import { Badge, Card, Section, SectionHeading } from "@/components/ui/primitives";
import { availability, services, engagementSteps } from "@/content/freelance";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Freelance",
  description:
    "Available for selected freelance AI/ML projects — RAG systems, AI agents, MCP tool servers, natural-language-to-SQL, guardrails and LLM evaluation.",
  alternates: { canonical: "/freelance" },
};

export default function FreelancePage() {
  return (
    <>
      {/* ---------------------------------------------------------- Header */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-[-6rem] h-80 w-[36rem] rounded-full opacity-50 blur-[110px]"
          style={{
            background: "radial-gradient(closest-side, var(--glow), transparent 75%)",
          }}
        />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            {availability.open ? (
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/70 py-1.5 pl-2 pr-4 text-xs backdrop-blur">
                <span className="relative grid h-5 w-5 place-items-center">
                  <span className="absolute h-2 w-2 rounded-full bg-success animate-pulse-ring" />
                  <span className="h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-fg-muted">Currently accepting projects</span>
              </div>
            ) : null}

            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              {availability.headline}
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              {availability.detail}
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border sm:grid-cols-3">
            <div className="bg-surface p-6">
              <Clock className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-3 text-sm font-medium">Capacity</p>
              <p className="mt-1 text-sm text-fg-muted">{availability.capacity}</p>
            </div>
            <div className="bg-surface p-6">
              <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-3 text-sm font-medium">Response time</p>
              <p className="mt-1 text-sm text-fg-muted">{availability.responseTime}</p>
            </div>
            <div className="bg-surface p-6">
              <Users className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-3 text-sm font-medium">I work with</p>
              <p className="mt-1 text-sm text-fg-muted">
                {availability.workingWith.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Services */}
      <Section id="services">
        <SectionHeading
          eyebrow="Services"
          title="What I can build for you"
          description="Every service listed here maps to something I have actually shipped — the note under each one says what backs it up."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 0.05}>
              <Card className="flex h-full flex-col p-6 sm:p-7">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {service.description}
                </p>

                <ul className="mt-5 space-y-2">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-fg-muted">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                        aria-hidden
                      />
                      {d}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-border pt-5 text-xs leading-relaxed text-fg-subtle">
                  <span className="font-medium text-fg-muted">Backed by: </span>
                  {service.backedBy}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Process */}
      <Section className="border-y border-border bg-bg-subtle">
        <SectionHeading eyebrow="How it works" title="From first message to shipped work" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {engagementSteps.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.06}>
              <Card className="h-full p-6">
                <span className="font-mono text-2xl font-semibold text-accent/40">
                  {step.step}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {step.detail}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- Inquiry */}
      <Section id="inquiry" className="scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Project inquiry"
              title="Tell me what you are building"
              description="Send the problem, not the spec. I read every inquiry personally."
              className="mb-8"
            />

            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-sm font-medium">Prefer email?</p>
                <a
                  href={profile.links.email}
                  className="mt-1.5 block break-all text-sm text-accent hover:underline"
                >
                  {profile.email}
                </a>
              </Card>

              <Card className="p-5">
                <p className="text-sm font-medium">What happens next</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  I reply within about a day — usually with a couple of questions
                  before anything else. If it is not a fit, I will say so
                  quickly rather than leave you waiting.
                </p>
              </Card>

              <div className="flex flex-wrap gap-2">
                {availability.workingWith.map((w) => (
                  <Badge key={w}>{w}</Badge>
                ))}
              </div>
            </div>
          </div>

          <InquiryForm />
        </div>
      </Section>
    </>
  );
}
