"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import {
  createJournalAction,
  createNoteAction,
  createProjectAction,
  type FormState,
} from "@/app/dashboard/journal/actions";
import { cn } from "@/lib/utils";

const initialState: FormState = { error: null };

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
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
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
      ) : hint ? (
        <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/**
 * Collapsible wrapper shared by all three forms, so a page defaults to its
 * content rather than to an empty form.
 */
function Collapsible({
  label,
  children,
}: {
  label: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close form"
          className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children(() => setOpen(false))}
    </div>
  );
}

/* --------------------------------------------------------------- journal */

export function JournalForm({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  return (
    <Collapsible label="New entry">
      {(close) => <JournalFormInner projects={projects} onDone={close} />}
    </Collapsible>
  );
}

function JournalFormInner({
  projects,
  onDone,
}: {
  projects: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(createJournalAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onDone();
    }
  }, [state.ok, onDone]);

  const errors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="p-5 sm:p-6">
      <form ref={ref} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="j-date" error={errors.date}>
            <input
              id="j-date"
              name="date"
              type="date"
              defaultValue={today}
              required
              className={cn(fieldClass, errors.date ? "border-danger" : "border-border")}
            />
          </Field>

          <Field label="Title" htmlFor="j-title" hint="Optional">
            <input
              id="j-title"
              name="title"
              placeholder="Graph RAG evaluation"
              className={cn(fieldClass, "border-border")}
            />
          </Field>

          <Field label="Project" htmlFor="j-project">
            <select id="j-project" name="projectId" className={cn(fieldClass, "border-border")}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Entry" htmlFor="j-body" error={errors.body}>
          <textarea
            id="j-body"
            name="body"
            rows={7}
            required
            placeholder="What happened today — decisions, dead ends, what you'd do differently. Write for the version of you reading this in six months."
            className={cn(
              fieldClass,
              "resize-y leading-relaxed",
              errors.body ? "border-danger" : "border-border",
            )}
          />
        </Field>

        <Field label="Tags" htmlFor="j-tags" hint="Comma separated">
          <input
            id="j-tags"
            name="tags"
            placeholder="graphrag, neo4j, evaluation"
            className={cn(fieldClass, "border-border")}
          />
        </Field>

        <ErrorBanner message={state.error} />

        <div className="flex items-center gap-3 pt-1">
          <Submit label="Save entry" />
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ----------------------------------------------------------------- notes */

export function NoteForm({ topics }: { topics: string[] }) {
  return <Collapsible label="New note">{(close) => <NoteFormInner topics={topics} onDone={close} />}</Collapsible>;
}

function NoteFormInner({ topics, onDone }: { topics: string[]; onDone: () => void }) {
  const [state, formAction] = useActionState(createNoteAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onDone();
    }
  }, [state.ok, onDone]);

  const errors = state.fieldErrors ?? {};

  return (
    <Card className="p-5 sm:p-6">
      <form ref={ref} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Topic"
            htmlFor="n-topic"
            error={errors.topic}
            hint="Groups related notes together"
          >
            <input
              id="n-topic"
              name="topic"
              list="note-topics"
              required
              placeholder="Agent optimization"
              className={cn(fieldClass, errors.topic ? "border-danger" : "border-border")}
            />
            {/* Existing topics as suggestions, without forcing a fixed list. */}
            <datalist id="note-topics">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>

          <Field label="Title" htmlFor="n-title" error={errors.title}>
            <input
              id="n-title"
              name="title"
              required
              placeholder="Why shadow evaluation beats inline judging"
              className={cn(fieldClass, errors.title ? "border-danger" : "border-border")}
            />
          </Field>
        </div>

        <Field label="Note" htmlFor="n-body" error={errors.body}>
          <textarea
            id="n-body"
            name="body"
            rows={7}
            required
            placeholder="What you learned, in your own words."
            className={cn(
              fieldClass,
              "resize-y leading-relaxed",
              errors.body ? "border-danger" : "border-border",
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source" htmlFor="n-source" hint="Optional — paper, doc, video">
            <input
              id="n-source"
              name="source"
              placeholder="https://…"
              className={cn(fieldClass, "border-border")}
            />
          </Field>

          <Field label="Tags" htmlFor="n-tags" hint="Comma separated">
            <input
              id="n-tags"
              name="tags"
              placeholder="evaluation, llm-judge"
              className={cn(fieldClass, "border-border")}
            />
          </Field>
        </div>

        <ErrorBanner message={state.error} />

        <div className="flex items-center gap-3 pt-1">
          <Submit label="Save note" />
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------- projects */

export function ProjectForm() {
  return <Collapsible label="New project">{(close) => <ProjectFormInner onDone={close} />}</Collapsible>;
}

function ProjectFormInner({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState(createProjectAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onDone();
    }
  }, [state.ok, onDone]);

  const errors = state.fieldErrors ?? {};

  return (
    <Card className="p-5 sm:p-6">
      <form ref={ref} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="p-name" error={errors.name}>
            <input
              id="p-name"
              name="name"
              required
              placeholder="Enterprise AI Platform"
              className={cn(fieldClass, errors.name ? "border-danger" : "border-border")}
            />
          </Field>

          <Field label="Context" htmlFor="p-context" hint="Employer, client, or personal">
            <input
              id="p-context"
              name="context"
              placeholder="Avira Digital"
              className={cn(fieldClass, "border-border")}
            />
          </Field>
        </div>

        <ErrorBanner message={state.error} />

        <div className="flex items-center gap-3 pt-1">
          <Submit label="Create project" />
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
