import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { Project } from "@/content/projects";
import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/ui/brand-icons";

const statusTone = {
  Active: "success",
  "In Progress": "warning",
  Delivered: "accent",
  Archived: "outline",
} as const;

export function ProjectCard({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  // Keep cards visually even: cap the tech chips and count the rest.
  const visibleTech = project.tech.slice(0, 5);
  const overflow = project.tech.length - visibleTech.length;

  return (
    <Card
      interactive
      className={cn("group relative flex flex-col p-6 sm:p-7", className)}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[project.status]}>{project.status}</Badge>
          {project.confidential ? (
            <Badge tone="outline">
              <Lock className="h-3 w-3" aria-hidden />
              Client work
            </Badge>
          ) : null}
        </div>
        <ArrowUpRight
          aria-hidden
          className="h-5 w-5 shrink-0 text-fg-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>

      <h3 className="text-lg font-semibold leading-snug">
        <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
          {project.name}
        </Link>
      </h3>

      <p className="mt-1.5 font-mono text-xs text-fg-subtle">{project.origin}</p>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
        {project.tagline}
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {visibleTech.map((tech) => (
          <span
            key={tech}
            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[0.7rem] text-fg-subtle"
          >
            {tech}
          </span>
        ))}
        {overflow > 0 ? (
          <span className="rounded-md px-2 py-1 text-[0.7rem] text-fg-subtle">
            +{overflow} more
          </span>
        ) : null}
      </div>

      {project.repo ? (
        <a
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
          // Sits above the card-wide link overlay so it stays independently clickable.
          className="relative z-10 mt-5 inline-flex w-fit items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-accent"
        >
          <GithubIcon className="h-3.5 w-3.5" aria-hidden />
          Source
        </a>
      ) : null}
    </Card>
  );
}
