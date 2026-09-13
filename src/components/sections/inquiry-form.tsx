"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import { inquirySchema } from "@/lib/validation";
import { projectTypes, budgetRanges, timelines } from "@/content/freelance";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

const fieldBase =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function InquiryForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    // Validate client-side first so obvious mistakes never hit the network.
    const parsed = inquirySchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please check the highlighted fields.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setErrors(body.fieldErrors ?? {});
        setMessage(
          body.fallbackEmail
            ? `${body.error} Please email me directly at ${body.fallbackEmail}.`
            : (body.error ?? "Something went wrong. Please try again."),
        );
        return;
      }

      form.reset();
      setStatus("success");
      setMessage(null);
    } catch {
      setStatus("error");
      setMessage(
        `Could not reach the server. Please email me directly at ${profile.email}.`,
      );
    }
  }

  if (status === "success") {
    return (
      <Card className="p-8 text-center sm:p-12">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-success/30 bg-success/10 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-xl font-semibold">Inquiry received</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          Thanks for reaching out. I read every inquiry personally and usually
          reply within 24 hours.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-7"
          onClick={() => setStatus("idle")}
        >
          Send another
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name" required error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              className={cn(fieldBase, errors.name ? "border-danger" : "border-border")}
            />
          </Field>

          <Field label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jane@company.com"
              className={cn(fieldBase, errors.email ? "border-danger" : "border-border")}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company" htmlFor="company" error={errors.company} hint="Optional">
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme Inc."
              className={cn(fieldBase, errors.company ? "border-danger" : "border-border")}
            />
          </Field>

          <Field label="Project type" htmlFor="projectType" required error={errors.projectType}>
            <select
              id="projectType"
              name="projectType"
              defaultValue=""
              className={cn(
                fieldBase,
                errors.projectType ? "border-danger" : "border-border",
              )}
            >
              <option value="" disabled>
                Select one…
              </option>
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="What are you building?"
          htmlFor="description"
          required
          error={errors.description}
          hint="The problem, who uses it, and what breaks today. Specifics help more than a spec."
        >
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="We have ~4,000 support docs and our current search returns the wrong answer for anything comparative…"
            className={cn(
              fieldBase,
              "resize-y",
              errors.description ? "border-danger" : "border-border",
            )}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Budget range" htmlFor="budgetRange" error={errors.budgetRange} hint="Optional">
            <select
              id="budgetRange"
              name="budgetRange"
              defaultValue=""
              className={cn(fieldBase, errors.budgetRange ? "border-danger" : "border-border")}
            >
              <option value="">Prefer not to say</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Timeline" htmlFor="timeline" error={errors.timeline} hint="Optional">
            <select
              id="timeline"
              name="timeline"
              defaultValue=""
              className={cn(fieldBase, errors.timeline ? "border-danger" : "border-border")}
            >
              <option value="">Not sure yet</option>
              {timelines.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Anything else"
          htmlFor="requirements"
          error={errors.requirements}
          hint="Optional — constraints, data access, existing stack, deadlines."
        >
          <textarea
            id="requirements"
            name="requirements"
            rows={3}
            className={cn(
              fieldBase,
              "resize-y",
              errors.requirements ? "border-danger" : "border-border",
            )}
          />
        </Field>

        {/* Honeypot — positioned off-screen and hidden from assistive tech. */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send inquiry
              </>
            )}
          </Button>
          <p className="text-xs text-fg-subtle">
            Or email me at{" "}
            <a href={profile.links.email} className="text-accent hover:underline">
              {profile.email}
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
}
