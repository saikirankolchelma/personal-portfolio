import type { Metadata } from "next";
import { Info } from "lucide-react";

import { ProjectExplorer } from "@/components/sections/project-explorer";
import { Section } from "@/components/ui/primitives";
import { projects, projectCategories } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Enterprise AI platforms, Graph RAG systems, agentic pipelines and self-directed AI infrastructure work.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Projects
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Systems I have designed, built and evaluated
            </h1>
            <p className="mt-7 text-base leading-relaxed text-fg-muted sm:text-lg">
              Enterprise agent platforms, clinical knowledge graphs, multi-agent
              data pipelines and a self-directed routing gateway. Each one has a
              full breakdown — the problem, the architecture, what went wrong,
              and what I would do next.
            </p>
          </div>

          <div className="mt-10 flex max-w-2xl items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
            <p className="text-sm leading-relaxed text-fg-muted">
              Client and employer projects are described only at the level of
              detail that appears on my public resume. No confidential
              architecture, data or client specifics are published here.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <ProjectExplorer projects={projects} categories={projectCategories} />
      </Section>
    </>
  );
}
