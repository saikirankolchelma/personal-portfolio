import type { ReactNode } from "react";
import { Database, Terminal } from "lucide-react";
import { Card } from "@/components/ui/primitives";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DashboardPage({ children }: { children: ReactNode }) {
  return <div className="px-5 py-8 sm:px-8 sm:py-10">{children}</div>;
}

/**
 * Shown in place of dashboard content when no database is configured.
 * An honest, actionable empty state beats a stack trace.
 */
export function SetupNotice() {
  return (
    <Card className="p-7 sm:p-9">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-warning/30 bg-warning/10 text-warning">
        <Database className="h-[1.1rem] w-[1.1rem]" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">Database not connected</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
        The dashboard needs a PostgreSQL connection before it can store tasks,
        journal entries or inquiries. Set <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code>{" "}
        in <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">.env.local</code>, then run:
      </p>

      <div className="mt-5 space-y-2">
        {[
          ["npm run db:push", "create the tables"],
          ["npm run db:seed", "create your owner account"],
        ].map(([command, note]) => (
          <div
            key={command}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5"
          >
            <Terminal className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden />
            <code className="font-mono text-sm text-fg">{command}</code>
            <span className="text-xs text-fg-subtle">— {note}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-fg-subtle">
        Seeding requires <code className="font-mono">OWNER_EMAIL</code> and{" "}
        <code className="font-mono">OWNER_PASSWORD</code> (at least 12 characters)
        in the same file.
      </p>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="px-6 py-14 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}
