"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/session";
import {
  createTask,
  deleteTask,
  updateTask,
  type TaskInput,
} from "@/lib/data/tasks";

/**
 * Task mutations.
 *
 * Every action resolves the owner from the session itself — no caller ever
 * supplies a user id. Combined with the userId-scoped `where` clauses in the
 * data layer, a forged task id simply matches nothing.
 */

const statusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "ARCHIVED",
]);
const categoryEnum = z.enum([
  "WORK",
  "LEARNING",
  "FREELANCING",
  "PERSONAL_PROJECT",
  "DSA",
  "AI_ML",
  "RESEARCH",
  "OTHER",
]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

/** Comma- or newline-separated free text into a clean string array. */
function toList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  description: z.string().trim().max(4000).optional(),
  date: z.coerce.date(),
  status: statusEnum,
  category: categoryEnum,
  priority: priorityEnum,
  projectId: z.string().trim().optional(),
  timeSpent: z.coerce.number().int().min(0).max(10_000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export type TaskFormState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    status: formData.get("status"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    projectId: formData.get("projectId") || undefined,
    timeSpent: formData.get("timeSpent") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

function toTaskInput(
  data: z.infer<typeof taskSchema>,
  formData: FormData,
): TaskInput {
  return {
    title: data.title,
    description: data.description ?? null,
    date: data.date,
    status: data.status,
    category: data.category,
    priority: data.priority,
    projectId: data.projectId || null,
    timeSpent: data.timeSpent ?? null,
    notes: data.notes ?? null,
    tags: toList(formData.get("tags")),
    nextSteps: toList(formData.get("nextSteps")),
  };
}

export async function createTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const userId = await requireUserId();
  const parsed = parseTaskForm(formData);

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    await createTask(userId, { ...toTaskInput(parsed.data, formData), source: "web" });
  } catch (error) {
    console.error("[dashboard] createTask failed", error);
    return { error: "Could not save the task. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  return { error: null, ok: true };
}

export async function updateTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing task id." };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const updated = await updateTask(userId, id, toTaskInput(parsed.data, formData));
  if (!updated) return { error: "That task no longer exists." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  return { error: null, ok: true };
}

/** Quick status change from a task row, without opening the editor. */
export async function setTaskStatusAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const status = statusEnum.safeParse(formData.get("status"));

  if (!id || !status.success) return;

  await updateTask(userId, id, { status: status.data });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteTask(userId, id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}
