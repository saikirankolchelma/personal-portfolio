import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Search, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/primitives";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SetupNotice,
} from "@/components/dashboard/shell";
import { NoteForm } from "@/components/dashboard/entry-forms";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { listNotes, noteTopics } from "@/lib/data/journal";
import { deleteNoteAction } from "@/app/dashboard/journal/actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Learning notes" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function NotesPage(props: PageProps<"/dashboard/notes">) {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Learning notes" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();
  const searchParams = await props.searchParams;
  const search = one(searchParams.q);
  const topic = one(searchParams.topic);

  const [notes, topics] = await Promise.all([
    listNotes(userId, { search, topic }),
    noteTopics(userId),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Learning notes"
        description="What you learned, in your own words — grouped by topic so it is findable later."
        action={<NoteForm topics={topics.map((t) => t.topic)} />}
      />

      <Card className="mb-6 p-4">
        <form method="get" className="relative mb-4">
          {topic ? <input type="hidden" name="topic" value={topic} /> : null}
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </form>

        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/notes"
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                !topic
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border text-fg-muted hover:text-fg",
              )}
            >
              All topics
            </Link>
            {topics.map((t) => (
              <Link
                key={t.topic}
                href={
                  topic === t.topic
                    ? "/dashboard/notes"
                    : `/dashboard/notes?topic=${encodeURIComponent(t.topic)}`
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                  topic === t.topic
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-border text-fg-muted hover:text-fg",
                )}
              >
                {t.topic}
                <span className="font-mono text-fg-subtle">{t.count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </Card>

      {notes.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">
                    {note.topic}
                  </p>
                  <h2 className="mt-1.5 text-base font-semibold">{note.title}</h2>
                </div>
                <form action={deleteNoteAction} className="shrink-0">
                  <input type="hidden" name="id" value={note.id} />
                  <button
                    type="submit"
                    aria-label="Delete note"
                    title="Delete note"
                    className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {note.body}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                {note.source ? (
                  <a
                    href={note.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    Source
                  </a>
                ) : null}
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[0.7rem] text-fg-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search || topic ? "No matching notes" : "No notes yet"}
          description={
            search || topic
              ? "Try a different topic or search term."
              : "Capture what you learn as you learn it. Future you will not remember the details."
          }
        />
      )}
    </DashboardPage>
  );
}
