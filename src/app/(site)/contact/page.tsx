import type { Metadata } from "next";
import { ArrowRight, Mail, MapPin, Briefcase, MessageSquare } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui/primitives";
import { profile } from "@/content/profile";
import { availability } from "@/content/freelance";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${profile.name} — AI/ML Engineer based in ${profile.location}. Open to freelance AI/ML projects and hiring conversations.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    id: "email",
    icon: Mail,
    label: "Email",
    value: profile.email,
    href: profile.links.email,
    note: "The most reliable way to reach me. I read everything.",
    external: false,
  },
  {
    id: "linkedin",
    icon: LinkedinIcon,
    label: "LinkedIn",
    value: "in/ksaikiran129",
    href: profile.links.linkedin,
    note: "Best for hiring conversations and professional networking.",
    external: true,
  },
  {
    id: "github",
    icon: GithubIcon,
    label: "GitHub",
    value: "saikirankolchelma",
    href: profile.links.github,
    note: "Code, experiments and whatever I am currently building.",
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Contact
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Let&apos;s talk
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              Hiring, scoping a freelance build, or just want to compare notes on
              agent architecture and retrieval design — all three are welcome.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-fg-subtle">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {profile.location} · Usually replies within 24 hours
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.id} interactive className="group relative p-6 sm:p-7">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
                  <Icon className="h-[1.1rem] w-[1.1rem]" />
                </div>
                <h2 className="mt-5 text-base font-semibold">
                  <a
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className="after:absolute after:inset-0"
                  >
                    {channel.label}
                  </a>
                </h2>
                <p className="mt-1.5 break-all text-sm text-accent">{channel.value}</p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {channel.note}
                </p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="border-t border-border bg-bg-subtle pt-0 sm:pt-0">
        <div className="grid gap-5 pt-16 sm:pt-24 md:grid-cols-2">
          <Card className="p-7 sm:p-9">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
              <Briefcase className="h-[1.1rem] w-[1.1rem]" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Freelance project?</h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              There is a structured inquiry form that asks the right questions up
              front — project type, scope, budget and timeline — so the first
              reply can be useful instead of a list of questions.
            </p>
            <p className="mt-4 text-sm text-fg-subtle">{availability.capacity}</p>
            <ButtonLink href="/freelance#inquiry" className="mt-7">
              Start a project inquiry
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </Card>

          <Card className="p-7 sm:p-9">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
              <MessageSquare className="h-[1.1rem] w-[1.1rem]" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Recruiting?</h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Email or LinkedIn both work. If it helps, the experience page has
              the full breakdown of what I have worked on, and each project has
              its own architecture write-up.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={profile.links.email} variant="secondary">
                <Mail className="h-4 w-4" />
                Email me
              </ButtonLink>
              <ButtonLink href="/experience" variant="ghost">
                View experience
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <SectionHeading
          align="center"
          eyebrow="Elsewhere"
          title="Find me online"
          className="mb-8"
        />
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={profile.links.linkedin} external variant="secondary" size="lg">
            <LinkedinIcon className="h-4 w-4" />
            LinkedIn
          </ButtonLink>
          <ButtonLink href={profile.links.github} external variant="secondary" size="lg">
            <GithubIcon className="h-4 w-4" />
            GitHub
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
