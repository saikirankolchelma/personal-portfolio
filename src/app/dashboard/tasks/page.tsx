import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/primitives";
import { DashboardPage, EmptyState, PageHeader, SetupNotice } from "@/components/dashboard/shell";
import { NewTaskPanel } from "@/components/dashboard/task-form";
import { TaskRow } from "@/components/dashboard/task-row";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { countTasks, listProjects, listTasks, type TaskFilters } from "@/lib/data/tasks";
import { taskCategoryLabels, taskStatusLabels } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/** Rebuilds the querystring with one key changed, so filters compose. */
function href(
  current: Record<string, string | undefined>,
  key: string,
  value: string | undefined,
) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, [key]: value })) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/dashboard/tasks?${qs}` : "/dashboard/tasks";
}

export default async function TasksPage(props: PageProps<"/dashboard/tasks">) {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Tasks" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();
  const searchParams = await props.searchParams;

  const status = one(searchParams.status);
  const category = one(searchParams.category);
  const search = one(searchParams.q);
  const page = Math.max(1, Number(one(searchParams.page) ?? 1) || 1);

  const active = { status, category, q: search };

  const filters: TaskFilters = {
    status: status as TaskFilters["status"],
    category: category as TaskFilters["category"],
    search,
  };

  const [tasks, total, projects] = await Promise.all([
    listTasks(userId, filters, { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    countTasks(userId, filters),
    listProjects(userId),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <DashboardPage>
      <PageHeader
        title="Tasks"
        description={`${total} task${total === 1 ? "" : "s"} in your work history.`}
        action={<NewTaskPanel projects={projectOptions} />}
      />

      {/* ------------------------------------------------------- filters */}
      <Card className="mb-6 p-4">
        <form method="get" className="mb-4 flex gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search titles, descriptions, notes and tags…"
              aria-label="Search tasks"
              className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>
        </form>

        <div className="space-y-3">
          <FilterRow
            label="Status"
            options={Object.entries(taskStatusLabels)}
            activeValue={status}
            makeHref={(v) => href(active, "status", v)}
          />
          <FilterRow
            label="Category"
            options={Object.entries(taskCategoryLabels)}
            activeValue={category}
            makeHref={(v) => href(active, "category", v)}
          />
        </div>
      </Card>

      {/* --------------------------------------------------------- list */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search || status || category ? "No matching tasks" : "No tasks yet"}
          description={
            search || status || category
              ? "Try widening the filters, or clear the search."
              : "Add your first task above, or send a message to your Telegram bot."
          }
        />
      )}

      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href(active, "page", p === 1 ? undefined : String(p))}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm transition-colors",
                p === page
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border text-fg-muted hover:text-fg",
              )}
            >
              {p}
            </Link>
          ))}
        </nav>
      ) : null}
    </DashboardPage>
  );
}

function FilterRow({
  label,
  options,
  activeValue,
  makeHref,
}: {
  label: string;
  options: [string, string][];
  activeValue: string | undefined;
  makeHref: (value: string | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-subtle">
        {label}
      </span>
      <Link
        href={makeHref(undefined)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs transition-colors",
          !activeValue
            ? "border-accent/40 bg-accent-soft text-accent"
            : "border-border text-fg-muted hover:text-fg",
        )}
      >
        All
      </Link>
      {options.map(([value, text]) => (
        <Link
          key={value}
          href={makeHref(activeValue === value ? undefined : value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            activeValue === value
              ? "border-accent/40 bg-accent-soft text-accent"
              : "border-border text-fg-muted hover:text-fg",
          )}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
