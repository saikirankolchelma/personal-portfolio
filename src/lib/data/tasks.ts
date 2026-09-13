import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma, TaskCategory, TaskPriority, TaskStatus } from "@prisma/client";

/**
 * Task queries.
 *
 * Every function takes `userId` as its first argument and folds it into the
 * `where` clause. There is deliberately no "find task by id" that omits it —
 * an id alone must never be enough to read or mutate a row.
 */

export type TaskFilters = {
  status?: TaskStatus;
  category?: TaskCategory;
  projectId?: string;
  search?: string;
  from?: Date;
  to?: Date;
};

function buildWhere(userId: string, filters: TaskFilters = {}): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId };

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.projectId) where.projectId = filters.projectId;

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  return where;
}

export async function listTasks(
  userId: string,
  filters: TaskFilters = {},
  { take = 100, skip = 0 } = {},
) {
  return prisma.task.findMany({
    where: buildWhere(userId, filters),
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
    skip,
  });
}

export async function countTasks(userId: string, filters: TaskFilters = {}) {
  return prisma.task.count({ where: buildWhere(userId, filters) });
}

/** Returns null rather than another user's row when the id does not belong. */
export async function getTask(userId: string, id: string) {
  return prisma.task.findFirst({
    where: { id, userId },
    include: { project: { select: { id: true, name: true } } },
  });
}

export async function listProjects(userId: string) {
  return prisma.workProject.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

/** Counts per status, for the dashboard summary tiles. */
export async function taskStatusCounts(userId: string) {
  const rows = await prisma.task.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    BLOCKED: 0,
    ARCHIVED: 0,
  };
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

/** Completed-task counts per day over the last `days` days, oldest first. */
export async function completionTrend(userId: string, days = 14) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const rows = await prisma.task.findMany({
    where: { userId, status: "COMPLETED", date: { gte: since } },
    select: { date: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export type TaskInput = {
  title: string;
  description?: string | null;
  date: Date;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  projectId?: string | null;
  timeSpent?: number | null;
  notes?: string | null;
  tags: string[];
  nextSteps: string[];
  source?: string;
};

export async function createTask(userId: string, input: TaskInput) {
  return prisma.task.create({
    data: {
      ...input,
      userId,
      completedAt: input.status === "COMPLETED" ? new Date() : null,
    },
  });
}

export async function updateTask(
  userId: string,
  id: string,
  input: Partial<TaskInput>,
) {
  // updateMany scopes by userId, so an id belonging to someone else matches
  // zero rows instead of updating theirs.
  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: {
      ...input,
      ...(input.status
        ? { completedAt: input.status === "COMPLETED" ? new Date() : null }
        : {}),
    },
  });
  return result.count > 0;
}

export async function deleteTask(userId: string, id: string) {
  const result = await prisma.task.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
