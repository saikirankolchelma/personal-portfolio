import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exports the owner's own data as JSON or CSV.
 *
 * Authenticated, and every query is scoped to the session user — an export
 * endpoint that leaked would hand over the entire private workspace at once,
 * so it gets the same treatment as any other private route.
 */

type Dataset = "tasks" | "journal" | "notes" | "all";

/** RFC 4180 quoting: wrap in quotes, double any internal quote. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value)
    ? value.join("; ")
    : value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(",")),
  ].join("\r\n");
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "The database is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const raw = url.searchParams.get("type");
  const dataset: Dataset = (
    ["tasks", "journal", "notes", "all"] as const
  ).includes(raw as never)
    ? (raw as Dataset)
    : "all";

  const wantTasks = dataset === "tasks" || dataset === "all";
  const wantJournal = dataset === "journal" || dataset === "all";
  const wantNotes = dataset === "notes" || dataset === "all";

  const [tasks, journal, notes] = await Promise.all([
    wantTasks
      ? prisma.task.findMany({
          where: { userId },
          include: { project: { select: { name: true } } },
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
    wantJournal
      ? prisma.journalEntry.findMany({
          where: { userId },
          include: { project: { select: { name: true } } },
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
    wantNotes
      ? prisma.learningNote.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const flatTasks = tasks.map((t) => ({
    date: t.date,
    title: t.title,
    description: t.description,
    status: t.status,
    category: t.category,
    priority: t.priority,
    project: t.project?.name ?? "",
    timeSpentMinutes: t.timeSpent,
    tags: t.tags,
    nextSteps: t.nextSteps,
    notes: t.notes,
    source: t.source,
    createdAt: t.createdAt.toISOString(),
  }));

  const flatJournal = journal.map((e) => ({
    date: e.date,
    title: e.title,
    body: e.body,
    project: e.project?.name ?? "",
    tags: e.tags,
    mood: e.mood,
    createdAt: e.createdAt.toISOString(),
  }));

  const flatNotes = notes.map((n) => ({
    topic: n.topic,
    title: n.title,
    body: n.body,
    source: n.source,
    tags: n.tags,
    createdAt: n.createdAt.toISOString(),
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    // CSV is one flat table, so "all" is not meaningful — pick a single set.
    const rows = wantTasks
      ? flatTasks
      : wantJournal
        ? flatJournal
        : flatNotes;
    const name = wantTasks ? "tasks" : wantJournal ? "journal" : "notes";

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="workspace-${name}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    counts: {
      tasks: flatTasks.length,
      journal: flatJournal.length,
      notes: flatNotes.length,
    },
    ...(wantTasks ? { tasks: flatTasks } : {}),
    ...(wantJournal ? { journal: flatJournal } : {}),
    ...(wantNotes ? { notes: flatNotes } : {}),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="workspace-${dataset}-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
