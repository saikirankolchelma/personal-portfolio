import { CalendarDays, Check, Clock, Play, Trash2 } from "lucide-react";

import { Badge, Card } from "@/components/ui/primitives";
import { deleteTaskAction, setTaskStatusAction } from "@/app/dashboard/actions";
import {
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  status: keyof typeof taskStatusLabels;
  category: keyof typeof taskCategoryLabels;
  priority: keyof typeof taskPriorityLabels;
  timeSpent: number | null;
  tags: string[];
  nextSteps: string[];
  source: string;
  project: { id: string; name: string; color: string | null } | null;
};

const statusTone = {
  TODO: "outline",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  BLOCKED: "danger",
  ARCHIVED: "default",
} as const;

const priorityTone = {
  LOW: "text-fg-subtle",
  MEDIUM: "text-fg-muted",
  HIGH: "text-warning",
  URGENT: "text-danger",
} as const;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Inline status button — a form post, so it works without JavaScript. */
function StatusButton({
  id,
  status,
  label,
  icon: Icon,
}: {
  id: string;
  status: keyof typeof taskStatusLabels;
  label: string;
  icon: typeof Check;
}) {
  return (
    <form action={setTaskStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        title={label}
        aria-label={label}
        className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-accent"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export function TaskRow({ task }: { task: TaskRowData }) {
  const done = task.status === "COMPLETED";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "text-sm font-medium",
                done && "text-fg-muted line-through decoration-fg-subtle",
              )}
            >
              {task.title}
            </h3>
            <Badge tone={statusTone[task.status]}>
              {taskStatusLabels[task.status]}
            </Badge>
            {task.source === "telegram" ? (
              <Badge tone="outline">via message</Badge>
            ) : null}
          </div>

          {task.description ? (
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {task.description}
            </p>
          ) : null}

          {task.nextSteps.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-subtle">
                Next
              </p>
              <ul className="space-y-1">
                {task.nextSteps.map((step) => (
                  <li key={step} className="flex gap-2 text-sm text-fg-muted">
                    <span
                      aria-hidden
                      className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                    />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {formatDate(task.date)}
            </span>
            <span>{taskCategoryLabels[task.category]}</span>
            <span className={priorityTone[task.priority]}>
              {taskPriorityLabels[task.priority]}
            </span>
            {task.project ? <span>{task.project.name}</span> : null}
            {task.timeSpent ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" aria-hidden />
                {formatDuration(task.timeSpent)}
              </span>
            ) : null}
          </div>

          {task.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[0.7rem] text-fg-subtle"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {task.status !== "IN_PROGRESS" && !done ? (
            <StatusButton
              id={task.id}
              status="IN_PROGRESS"
              label="Mark in progress"
              icon={Play}
            />
          ) : null}
          {!done ? (
            <StatusButton
              id={task.id}
              status="COMPLETED"
              label="Mark completed"
              icon={Check}
            />
          ) : (
            <StatusButton id={task.id} status="TODO" label="Reopen" icon={Play} />
          )}
          <form action={deleteTaskAction}>
            <input type="hidden" name="id" value={task.id} />
            <button
              type="submit"
              title="Delete task"
              aria-label="Delete task"
              className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </Card>
  );
}
