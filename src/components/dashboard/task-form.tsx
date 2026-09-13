"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormState,
} from "@/app/dashboard/actions";
import {
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type ProjectOption = { id: string; name: string };

export type TaskDefaults = {
  id?: string;
  title?: string;
  description?: string | null;
  date?: string;
  status?: keyof typeof taskStatusLabels;
  category?: keyof typeof taskCategoryLabels;
  priority?: keyof typeof taskPriorityLabels;
  projectId?: string | null;
  timeSpent?: number | null;
  notes?: string | null;
  tags?: string[];
  nextSteps?: string[];
};

const initialState: TaskFormState = { error: null };

const fieldClass =
  "w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TaskForm({
  projects,
  defaults,
  onDone,
}: {
  projects: ProjectOption[];
  defaults?: TaskDefaults;
  onDone?: () => void;
}) {
  const editing = Boolean(defaults?.id);
  const [state, formAction] = useActionState(
    editing ? updateTaskAction : createTaskAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful create; keep values when editing.
  useEffect(() => {
    if (!state.ok) return;
    if (!editing) formRef.current?.reset();
    onDone?.();
  }, [state.ok, editing, onDone]);

  const errors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="p-5 sm:p-6">
      <form ref={formRef} action={formAction} className="space-y-4">
        {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

        <Field label="Title" htmlFor="title" error={errors.title}>
          <input
            id="title"
            name="title"
            defaultValue={defaults?.title}
            placeholder="Implement guardrail node for task-level checks"
            required
            className={cn(fieldClass, errors.title ? "border-danger" : "border-border")}
          />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description}>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaults?.description ?? ""}
            placeholder="What the work involved, decisions made, anything worth remembering later."
            className={cn(
              fieldClass,
              "resize-y",
              errors.description ? "border-danger" : "border-border",
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date" htmlFor="date" error={errors.date}>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={defaults?.date ?? today}
              required
              className={cn(fieldClass, errors.date ? "border-danger" : "border-border")}
            />
          </Field>

          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              defaultValue={defaults?.status ?? "TODO"}
              className={cn(fieldClass, "border-border")}
            >
              {Object.entries(taskStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Category" htmlFor="category">
            <select
              id="category"
              name="category"
              defaultValue={defaults?.category ?? "WORK"}
              className={cn(fieldClass, "border-border")}
            >
              {Object.entries(taskCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority" htmlFor="priority">
            <select
              id="priority"
              name="priority"
              defaultValue={defaults?.priority ?? "MEDIUM"}
              className={cn(fieldClass, "border-border")}
            >
              {Object.entries(taskPriorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project" htmlFor="projectId">
            <select
              id="projectId"
              name="projectId"
              defaultValue={defaults?.projectId ?? ""}
              className={cn(fieldClass, "border-border")}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Time spent (minutes)" htmlFor="timeSpent" error={errors.timeSpent}>
            <input
              id="timeSpent"
              name="timeSpent"
              type="number"
              min={0}
              defaultValue={defaults?.timeSpent ?? ""}
              placeholder="90"
              className={cn(
                fieldClass,
                errors.timeSpent ? "border-danger" : "border-border",
              )}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tags (comma separated)" htmlFor="tags">
            <input
              id="tags"
              name="tags"
              defaultValue={defaults?.tags?.join(", ")}
              placeholder="guardrails, langgraph"
              className={cn(fieldClass, "border-border")}
            />
          </Field>

          <Field label="Next steps (comma separated)" htmlFor="nextSteps">
            <input
              id="nextSteps"
              name="nextSteps"
              defaultValue={defaults?.nextSteps?.join(", ")}
              placeholder="Test MMR retrieval"
              className={cn(fieldClass, "border-border")}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="notes" error={errors.notes}>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={defaults?.notes ?? ""}
            className={cn(
              fieldClass,
              "resize-y",
              errors.notes ? "border-danger" : "border-border",
            )}
          />
        </Field>

        {state.error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <Submit label={editing ? "Save changes" : "Add task"} />
          {onDone ? (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

/** Collapsible wrapper so the form does not dominate the page. */
export function NewTaskPanel({ projects }: { projects: ProjectOption[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        New task
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">New task</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close form"
          className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <TaskForm projects={projects} onDone={() => setOpen(false)} />
    </div>
  );
}
