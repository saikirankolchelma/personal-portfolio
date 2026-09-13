import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Layers,
  Lightbulb,
  ListChecks,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { GithubIcon } from "@/components/ui/brand-icons";
import {
  Badge,
  BulletList,
  ButtonLink,
  Card,
  Section,
} from "@/components/ui/primitives";
import { ProjectCard } from "@/components/sections/project-card";
import { projects, getProject } from "@/content/projects";

/** Pre-render every project page at build time. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);

  if (!project) return { title: "Project not found" };

  return {
    title: project.name,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title: project.name, description: project.tagline },
  };
}

const statusTone = {
  Active: "success",
  "In Progress": "warning",
  Delivered: "accent",
  Archived: "outline",
} as const;

/** A titled block with an icon — used for each section of the breakdown. */
function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2.5 text-lg font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/25 bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);

  if (!project) notFound();

  const related = projects
    .filter(
      (p) =>
        p.slug !== project.slug &&
        p.category.some((c) => project.category.includes(c)),
    )
    .slice(0, 2);

  return (
    <>
      {/* ---------------------------------------------------------- Header */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-14 sm:py-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All projects
          </Link>

          <div className="mt-8 max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[project.status]}>{project.status}</Badge>
              {project.category.map((c) => (
                <Badge key={c} tone="outline">
                  {c}
                </Badge>
              ))}
              {project.confidential ? (
                <Badge tone="outline">
                  <Lock className="h-3 w-3" aria-hidden />
                  Client work
                </Badge>
              ) : null}
            </div>

            <h1 className="text-3xl font-semibold leading-[1.12] sm:text-5xl">
              {project.name}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-fg-muted sm:text-lg">
              {project.tagline}
            </p>

            <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                  Context
                </dt>
                <dd className="mt-2 text-sm text-fg">{project.origin}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                  Period
                </dt>
                <dd className="mt-2 text-sm text-fg">{project.period}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                  My role
                </dt>
                <dd className="mt-2 text-sm text-fg">{project.role}</dd>
              </div>
            </dl>

            {project.repo || project.demo ? (
              <div className="mt-9 flex flex-wrap gap-3">
                {project.repo ? (
                  <ButtonLink href={project.repo} external variant="secondary" size="sm">
                    <GithubIcon className="h-4 w-4" />
                    View source
                  </ButtonLink>
                ) : null}
                {project.demo ? (
                  <ButtonLink href={project.demo} external size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Live demo
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Content */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <Block icon={Target} title="The problem">
              <p className="text-base leading-relaxed text-fg-muted">
                {project.problem}
              </p>
              <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.08em] text-fg-subtle">
                Why it needed solving
              </h3>
              <p className="text-base leading-relaxed text-fg-muted">{project.why}</p>
            </Block>

            <Block icon={Lightbulb} title="The approach">
              <p className="text-base leading-relaxed text-fg-muted">
                {project.solution}
              </p>
            </Block>

            <Block icon={Layers} title="Architecture">
              <BulletList items={project.architecture} />
            </Block>

            <Block icon={Wrench} title="Implementation">
              <BulletList items={project.implementation} />
            </Block>

            <Block icon={Sparkles} title="AI/ML components">
              <div className="grid gap-3 sm:grid-cols-2">
                {project.aiComponents.map((component) => (
                  <Card key={component} className="px-4 py-3.5">
                    <p className="text-sm text-fg-muted">{component}</p>
                  </Card>
                ))}
              </div>
            </Block>

            <Block icon={ListChecks} title="Challenges & how they were handled">
              <div className="space-y-4">
                {project.challenges.map((item) => (
                  <Card key={item.challenge} className="p-5 sm:p-6">
                    <p className="text-sm font-medium leading-relaxed">
                      {item.challenge}
                    </p>
                    <div className="mt-4 flex gap-3 border-l-2 border-accent/40 pl-4">
                      <p className="text-sm leading-relaxed text-fg-muted">
                        {item.response}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Block>

            {project.results.length > 0 ? (
              <Block icon={TrendingUp} title="Results">
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.results.map((result) => (
                    <Card key={result.label} className="p-5 sm:p-6">
                      <p className="text-lg font-semibold text-accent">
                        {result.value}
                      </p>
                      <p className="mt-1.5 text-sm text-fg-muted">{result.label}</p>
                    </Card>
                  ))}
                </div>
              </Block>
            ) : null}

            {project.future.length > 0 ? (
              <Block icon={ArrowRight} title="What comes next">
                <BulletList items={project.future} />
              </Block>
            ) : null}
          </div>

          {/* ------------------------------------------------------ Aside */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                Technologies
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[0.7rem] text-fg-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>

            {project.confidential ? (
              <Card className="mt-4 p-6">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
                  Confidentiality
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  This was client or employer work. Everything described here is
                  at the level of detail published on my resume — no proprietary
                  architecture, data or client specifics.
                </p>
              </Card>
            ) : null}

            <Card className="mt-4 p-6">
              <p className="text-sm font-medium">Want something like this built?</p>
              <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                I take on a small number of freelance AI/ML engagements.
              </p>
              <ButtonLink href="/freelance#inquiry" size="sm" className="mt-5 w-full">
                Start a project
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </Section>

      {/* --------------------------------------------------------- Related */}
      {related.length > 0 ? (
        <Section className="border-t border-border bg-bg-subtle">
          <h2 className="mb-8 text-xl font-semibold">Related work</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {related.map((p) => (
              <ProjectCard key={p.slug} project={p} className="h-full" />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
