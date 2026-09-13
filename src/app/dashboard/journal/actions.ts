"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/session";
import {
  createJournalEntry,
  createNote,
  createProject,
  deleteJournalEntry,
  deleteNote,
  deleteProject,
  updateProject,
} from "@/lib/data/journal";

/**
 * Journal, note and project mutations.
 *
 * As with tasks, the owner comes from the session and never from the form, and
 * the data layer scopes every write by userId.
 */

export type FormState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function toTags(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/* -------------------------------------------------------------- journal */

const journalSchema = z.object({
  date: z.coerce.date(),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1, "Write something first").max(20_000),
  projectId: z.string().trim().optional(),
  mood: z.string().trim().max(40).optional(),
});

export async function createJournalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = journalSchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    projectId: formData.get("projectId") || undefined,
    mood: formData.get("mood") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    await createJournalEntry(userId, {
      date: parsed.data.date,
      title: parsed.data.title ?? null,
      body: parsed.data.body,
      projectId: parsed.data.projectId || null,
      mood: parsed.data.mood ?? null,
      tags: toTags(formData.get("tags")),
    });
  } catch (error) {
    console.error("[dashboard] createJournalEntry failed", error);
    return { error: "Could not save the entry. Please try again." };
  }

  revalidatePath("/dashboard/journal");
  return { error: null, ok: true };
}

export async function deleteJournalAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteJournalEntry(userId, id);
  revalidatePath("/dashboard/journal");
}

/* ---------------------------------------------------------------- notes */

const noteSchema = z.object({
  topic: z.string().trim().min(1, "A topic is required").max(80),
  title: z.string().trim().min(1, "A title is required").max(200),
  body: z.string().trim().min(1, "Write something first").max(20_000),
  source: z.string().trim().max(500).optional(),
});

export async function createNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = noteSchema.safeParse({
    topic: formData.get("topic"),
    title: formData.get("title"),
    body: formData.get("body"),
    source: formData.get("source") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    await createNote(userId, {
      ...parsed.data,
      source: parsed.data.source ?? null,
      tags: toTags(formData.get("tags")),
    });
  } catch (error) {
    console.error("[dashboard] createNote failed", error);
    return { error: "Could not save the note. Please try again." };
  }

  revalidatePath("/dashboard/notes");
  return { error: null, ok: true };
}

export async function deleteNoteAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteNote(userId, id);
  revalidatePath("/dashboard/notes");
}

/* ------------------------------------------------------------- projects */

const projectSchema = z.object({
  name: z.string().trim().min(1, "A name is required").max(120),
  context: z.string().trim().max(120).optional(),
});

/** URL-safe slug derived from the name, so the user never types one. */
function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export async function createProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    context: formData.get("context") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    await createProject(userId, {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      context: parsed.data.context ?? null,
      active: true,
    });
  } catch (error) {
    // The unique index is on (userId, slug), so a clash means a duplicate name.
    console.error("[dashboard] createProject failed", error);
    return { error: "Could not create that project — the name may already exist." };
  }

  revalidatePath("/dashboard/projects");
  return { error: null, ok: true };
}

export async function toggleProjectAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await updateProject(userId, id, { active });
  revalidatePath("/dashboard/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Tasks and journal entries survive with projectId set to null.
  await deleteProject(userId, id);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/tasks");
}
