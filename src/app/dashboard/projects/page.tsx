import type { Metadata } from "next";
import { Archive, ArchiveRestore, BookOpen, CheckSquare, Trash2 } from "lucide-react";

import { Badge, Card } from "@/components/ui/primitives";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SetupNotice,
} from "@/components/dashboard/shell";
import { ProjectForm } from "@/components/dashboard/entry-forms";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { listProjectsWithCounts } from "@/lib/data/journal";
import { deleteProjectAction, toggleProjectAction } from "@/app/dashboard/journal/actions";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Projects" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();
  const projects = await listProjectsWithCounts(userId);

  const active = projects.filter((p) => p.active);
  const archived = projects.filter((p) => !p.active);

  return (
    <DashboardPage>
      <PageHeader
        title="Projects"
        description="Buckets for grouping tasks and journal entries. Archiving hides a project without touching its history."
        action={<ProjectForm />}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create one to group related work. Tasks can also live without a project."
        />
      ) : (
        <div className="space-y-8">
          {[
            { heading: "Active", items: active },
            { heading: "Archived", items: archived },
          ].map(({ heading, items }) =>
            items.length > 0 ? (
              <section key={heading}>
                <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                  {heading}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((project) => (
                    <Card key={project.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold">{project.name}</h3>
                          {project.context ? (
                            <p className="mt-1 text-sm text-fg-subtle">
                              {project.context}
                            </p>
                          ) : null}
                        </div>
                        {!project.active ? <Badge tone="outline">Archived</Badge> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="h-3 w-3" aria-hidden />
                          {project._count.tasks} task
                          {project._count.tasks === 1 ? "" : "s"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3" aria-hidden />
                          {project._count.journal} entr
                          {project._count.journal === 1 ? "y" : "ies"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-4">
                        <form action={toggleProjectAction}>
                          <input type="hidden" name="id" value={project.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={project.active ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                          >
                            {project.active ? (
                              <>
                                <Archive className="h-3 w-3" aria-hidden />
                                Archive
                              </>
                            ) : (
                              <>
                                <ArchiveRestore className="h-3 w-3" aria-hidden />
                                Restore
                              </>
                            )}
                          </button>
                        </form>

                        <form action={deleteProjectAction}>
                          <input type="hidden" name="id" value={project.id} />
                          <button
                            type="submit"
                            title="Delete — tasks and entries are kept, just unassigned"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden />
                            Delete
                          </button>
                        </form>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-fg-subtle">
        Deleting a project keeps its tasks and journal entries — they simply
        become unassigned. Nothing in your work history is lost.
      </p>
    </DashboardPage>
  );
}
