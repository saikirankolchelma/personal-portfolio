import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Work journal and learning notes.
 *
 * Same rule as tasks: `userId` is always the first argument and always lands
 * in the `where` clause. There is no lookup by id alone.
 */

/* ------------------------------------------------------------- journal */

export type JournalFilters = { search?: string; projectId?: string };

function journalWhere(
  userId: string,
  filters: JournalFilters = {},
): Prisma.JournalEntryWhereInput {
  const where: Prisma.JournalEntryWhereInput = { userId };

  if (filters.projectId) where.projectId = filters.projectId;

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  return where;
}

export async function listJournal(
  userId: string,
  filters: JournalFilters = {},
  { take = 50, skip = 0 } = {},
) {
  return prisma.journalEntry.findMany({
    where: journalWhere(userId, filters),
    include: { project: { select: { id: true, name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
    skip,
  });
}

export async function countJournal(userId: string, filters: JournalFilters = {}) {
  return prisma.journalEntry.count({ where: journalWhere(userId, filters) });
}

export type JournalInput = {
  date: Date;
  title?: string | null;
  body: string;
  tags: string[];
  projectId?: string | null;
  mood?: string | null;
};

export async function createJournalEntry(userId: string, input: JournalInput) {
  return prisma.journalEntry.create({ data: { ...input, userId } });
}

export async function deleteJournalEntry(userId: string, id: string) {
  const result = await prisma.journalEntry.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/* --------------------------------------------------------------- notes */

export type NoteFilters = { search?: string; topic?: string };

function noteWhere(userId: string, filters: NoteFilters = {}): Prisma.LearningNoteWhereInput {
  const where: Prisma.LearningNoteWhereInput = { userId };

  if (filters.topic) where.topic = filters.topic;

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  return where;
}

export async function listNotes(
  userId: string,
  filters: NoteFilters = {},
  { take = 60, skip = 0 } = {},
) {
  return prisma.learningNote.findMany({
    where: noteWhere(userId, filters),
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}

/** Distinct topics with counts, for the filter rail. */
export async function noteTopics(userId: string) {
  const rows = await prisma.learningNote.groupBy({
    by: ["topic"],
    where: { userId },
    _count: { _all: true },
    orderBy: { topic: "asc" },
  });
  return rows.map((row) => ({ topic: row.topic, count: row._count._all }));
}

export type NoteInput = {
  topic: string;
  title: string;
  body: string;
  source?: string | null;
  tags: string[];
};

export async function createNote(userId: string, input: NoteInput) {
  return prisma.learningNote.create({ data: { ...input, userId } });
}

export async function deleteNote(userId: string, id: string) {
  const result = await prisma.learningNote.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/* ------------------------------------------------------------ projects */

export type ProjectInput = {
  name: string;
  slug: string;
  context?: string | null;
  active: boolean;
};

export async function createProject(userId: string, input: ProjectInput) {
  return prisma.workProject.create({ data: { ...input, userId } });
}

export async function updateProject(
  userId: string,
  id: string,
  input: Partial<ProjectInput>,
) {
  const result = await prisma.workProject.updateMany({
    where: { id, userId },
    data: input,
  });
  return result.count > 0;
}

export async function deleteProject(userId: string, id: string) {
  // Tasks and journal entries fall back to no project rather than vanishing
  // with it — the schema uses SetNull, so history survives.
  const result = await prisma.workProject.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/** Projects with the counts that make the management page useful. */
export async function listProjectsWithCounts(userId: string) {
  return prisma.workProject.findMany({
    where: { userId },
    include: {
      _count: { select: { tasks: true, journal: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}
