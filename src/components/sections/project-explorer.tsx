"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectCategory } from "@/content/projects";
import { ProjectCard } from "./project-card";
import { cn } from "@/lib/utils";

type Filter = ProjectCategory | "All";

export function ProjectExplorer({
  projects,
  categories,
}: {
  projects: Project[];
  categories: ProjectCategory[];
}) {
  const [filter, setFilter] = useState<Filter>("All");

  // Only offer categories that actually have projects behind them.
  const available = useMemo(
    () => categories.filter((c) => projects.some((p) => p.category.includes(c))),
    [categories, projects],
  );

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["All", projects.length]]);
    for (const c of available) {
      map.set(c, projects.filter((p) => p.category.includes(c)).length);
    }
    return map;
  }, [available, projects]);

  const visible = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((p) => p.category.includes(filter)),
    [filter, projects],
  );

  const filters: Filter[] = ["All", ...available];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter projects by category"
        className="mb-10 flex flex-wrap gap-2"
      >
        {filters.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                active
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {f}
              <span className={cn("font-mono text-xs", active ? "opacity-70" : "text-fg-subtle")}>
                {counts.get(f) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} className="h-full" />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-fg-muted">
          No projects in this category yet.
        </p>
      )}
    </div>
  );
}
