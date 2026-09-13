import type { Metadata } from "next";
import { Download, FileJson, Table2 } from "lucide-react";

import { Card } from "@/components/ui/primitives";
import { DashboardPage, PageHeader, SetupNotice } from "@/components/dashboard/shell";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Export" };
export const dynamic = "force-dynamic";

const datasets = [
  {
    id: "tasks",
    label: "Tasks",
    description: "Every task with its status, category, project, tags and next steps.",
  },
  {
    id: "journal",
    label: "Journal",
    description: "All journal entries with dates, projects and tags.",
  },
  {
    id: "notes",
    label: "Learning notes",
    description: "All notes grouped by topic, with sources.",
  },
] as const;

export default async function ExportPage() {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Export" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();

  const [tasks, journal, notes] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.learningNote.count({ where: { userId } }),
  ]);

  const counts: Record<string, number> = { tasks, journal, notes };

  return (
    <DashboardPage>
      <PageHeader
        title="Export"
        description="Download your workspace. It is your data — it should never be trapped in here."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id} className="flex flex-col p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">{dataset.label}</h2>
              <span className="font-mono text-sm text-accent">
                {counts[dataset.id] ?? 0}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
              {dataset.description}
            </p>

            <div className="mt-5 flex gap-2">
              {/* Plain links — the route sets Content-Disposition, so the
                  browser downloads rather than navigating. */}
              <a
                href={`/api/dashboard/export?type=${dataset.id}&format=json`}
                download
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <FileJson className="h-3.5 w-3.5" aria-hidden />
                JSON
              </a>
              <a
                href={`/api/dashboard/export?type=${dataset.id}&format=csv`}
                download
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <Table2 className="h-3.5 w-3.5" aria-hidden />
                CSV
              </a>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Everything</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Tasks, journal and notes in one JSON file — {tasks + journal + notes}{" "}
              records.
            </p>
          </div>
          <a
            href="/api/dashboard/export?type=all&format=json"
            download
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download all
          </a>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
          CSV is a single flat table, so it exports one dataset at a time. JSON
          keeps arrays like tags and next steps intact — use it if you plan to
          import the data somewhere else.
        </p>
      </Card>
    </DashboardPage>
  );
}
