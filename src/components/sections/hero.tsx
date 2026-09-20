import Image from "next/image";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { profile } from "@/content/profile";
import { marqueeSkills } from "@/content/skills";
import { availability } from "@/content/freelance";
import { ButtonLink } from "@/components/ui/primitives";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background: grid + a soft accent bloom behind the headline. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[26rem] w-[52rem] -translate-x-1/2 rounded-full opacity-70 blur-[120px]"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow), transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="container-px relative pb-16 pt-20 sm:pb-24 sm:pt-28">
        {/* Text and portrait sit side by side from lg up, stacked below it so
            the headline still leads on a phone. */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div className="animate-rise">
          {availability.open ? (
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/70 py-1.5 pl-2 pr-4 text-xs backdrop-blur">
              <span className="relative grid h-5 w-5 place-items-center">
                <span className="absolute h-2 w-2 rounded-full bg-success animate-pulse-ring" />
                <span className="h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-fg-muted">
                Available for freelance AI/ML projects
              </span>
            </div>
          ) : null}

          <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            <span>{profile.title}</span>
            <span aria-hidden className="text-border-strong">
              /
            </span>
            <span className="text-fg-subtle">Generative AI & Agentic Systems</span>
          </p>

          <h1 className="text-4xl font-semibold leading-[1.06] sm:text-6xl lg:text-[4.25rem]">
            <span className="block">{profile.name}</span>
            <span className="mt-2 block text-gradient">
              Building intelligent systems with LLMs, agents and retrieval.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {profile.experienceLabel} building enterprise Generative AI, agentic
            and RAG systems for pharmaceutical and business intelligence use
            cases — agent orchestration, MCP tooling, knowledge graphs, safety
            guardrails and the evaluation harnesses that prove any of it works.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/projects" size="lg">
              View projects
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/freelance" variant="secondary" size="lg">
              <Sparkles className="h-4 w-4" />
              Hire me
            </ButtonLink>
            <div className="flex items-center gap-2">
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="grid h-12 w-12 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <GithubIcon className="h-[1.15rem] w-[1.15rem]" />
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="grid h-12 w-12 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <LinkedinIcon className="h-[1.15rem] w-[1.15rem]" />
              </a>
            </div>
          </div>

          <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-subtle">
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {profile.location}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-1 w-1 rounded-full bg-fg-subtle" />
              {profile.currentRole} at {profile.currentCompany}
            </span>
          </p>
        </div>

        {/* ------------------------------------------------------ portrait */}
        <div className="animate-rise order-first lg:order-none">
          <div className="relative mx-auto w-full max-w-[17rem] lg:max-w-none">
            {/* Accent bloom behind the frame, tucked under it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 40%, var(--glow), transparent 75%)",
              }}
            />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_70px_-28px_var(--glow)]">
              <Image
                src="/sai-kiran.jpg"
                alt={`${profile.name}, ${profile.title}`}
                width={768}
                height={1364}
                // Above the fold, so it must not lazy-load.
                priority
                sizes="(min-width: 1024px) 24rem, 17rem"
                className="h-full w-full object-cover"
              />
              {/* Fades the photo into the card so the crop edge is not stark. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface/90 to-transparent"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Technology marquee. Duplicated once so the -50% translate loops seamlessly. */}
      <div className="relative border-y border-border bg-bg-subtle/60 py-4">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
            {[...marqueeSkills, ...marqueeSkills].map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
