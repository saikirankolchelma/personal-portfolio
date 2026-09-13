import type { Metadata } from "next";
import { Search, Trash2 } from "lucide-react";

import { Badge, Card } from "@/components/ui/primitives";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SetupNotice,
} from "@/components/dashboard/shell";
import { JournalForm } from "@/components/dashboard/entry-forms";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { countJournal, listJournal } from "@/lib/data/journal";
import { listProjects } from "@/lib/data/tasks";
import { deleteJournalAction } from "./actions";

export const metadata: Metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function JournalPage(props: PageProps<"/dashboard/journal">) {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Journal" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();
  const searchParams = await props.searchParams;
  const search = one(searchParams.q);

  const [entries, total, projects] = await Promise.all([
    listJournal(userId, { search }),
    countJournal(userId, {}),
    listProjects(userId),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Work journal"
        description="Longer-form notes on what happened and why — the context that a task title cannot carry."
        action={<JournalForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />}
      />

      <Card className="mb-6 p-4">
        <form method="get" className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search entries and tags…"
            aria-label="Search journal"
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </form>
        <p className="mt-3 text-xs text-fg-subtle">
          {search ? `${entries.length} matching` : `${total} entr${total === 1 ? "y" : "ies"}`}
        </p>
      </Card>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {entry.title ? (
                      <h2 className="text-base font-semibold">{entry.title}</h2>
                    ) : null}
                    {entry.project ? (
                      <Badge tone="outline">{entry.project.name}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-fg-subtle">
                    {entry.date.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>

                <form action={deleteJournalAction} className="shrink-0">
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    aria-label="Delete entry"
                    title="Delete entry"
                    className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {entry.body}
              </p>

              {entry.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[0.7rem] text-fg-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? "No matching entries" : "No journal entries yet"}
          description={
            search
              ? "Try a different search term."
              : "Tasks capture what you did. The journal is for why — decisions, dead ends, and what you would do differently."
          }
        />
      )}
    </DashboardPage>
  );
}
