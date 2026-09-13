import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDot, ListTodo, OctagonX } from "lucide-react";

import { Badge, ButtonLink, Card } from "@/components/ui/primitives";
import { DashboardPage, EmptyState, PageHeader, SetupNotice } from "@/components/dashboard/shell";
import { NewTaskPanel } from "@/components/dashboard/task-form";
import { TaskRow } from "@/components/dashboard/task-row";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import {
  completionTrend,
  listProjects,
  listTasks,
  taskStatusCounts,
} from "@/lib/data/tasks";

/** Always reflects the live database — nothing here is cacheable. */
export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardOverview() {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Overview" description="Your work at a glance." />
        <SetupNotice />
      </DashboardPage>
    );
  }

  const userId = await requireUserId();
  const today = startOfToday();

  const [counts, todays, recent, projects, trend] = await Promise.all([
    taskStatusCounts(userId),
    listTasks(userId, { from: today, to: today }, { take: 20 }),
    listTasks(userId, {}, { take: 8 }),
    listProjects(userId),
    completionTrend(userId, 14),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const maxInTrend = Math.max(1, ...trend.map((t) => t.count));
  const completedThisFortnight = trend.reduce((sum, t) => sum + t.count, 0);

  const tiles = [
    { label: "To do", value: counts.TODO, icon: ListTodo, tone: "text-fg" },
    { label: "In progress", value: counts.IN_PROGRESS, icon: CircleDot, tone: "text-warning" },
    { label: "Completed", value: counts.COMPLETED, icon: CheckCircle2, tone: "text-success" },
    { label: "Blocked", value: counts.BLOCKED, icon: OctagonX, tone: "text-danger" },
  ];

  return (
    <DashboardPage>
      <PageHeader
        title="Overview"
        description="Today's work, recent activity, and what is still open."
        action={<NewTaskPanel projects={projectOptions} />}
      />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.label} className="p-5">
              <Icon className={`h-4 w-4 ${tile.tone}`} aria-hidden />
              <dd className="mt-3 text-2xl font-semibold">{tile.value}</dd>
              <dt className="mt-1 text-xs text-fg-subtle">{tile.label}</dt>
            </Card>
          );
        })}
      </dl>

      {/* -------------------------------------------------- today's work */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Today</h2>
          <Badge tone="outline">
            {today.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}
          </Badge>
        </div>

        {todays.length > 0 ? (
          <div className="space-y-3">
            {todays.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing logged for today"
            description="Add a task above, or send a message to your Telegram bot and it will show up here."
          />
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ----------------------------------------------- recent tasks */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent</h2>
            <Link
              href="/dashboard/tasks"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:opacity-80"
            >
              All tasks
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tasks yet"
              description="Once you start logging work, the last two weeks of it will appear here."
            />
          )}
        </section>

        {/* ----------------------------------------------------- trend */}
        <aside className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-medium">Last 14 days</h3>
            <p className="mt-1 text-xs text-fg-subtle">
              {completedThisFortnight} task
              {completedThisFortnight === 1 ? "" : "s"} completed
            </p>

            <div className="mt-5 flex h-24 items-end gap-1" aria-hidden>
              {trend.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className="flex-1 rounded-t bg-accent/70"
                  style={{
                    height: `${Math.max(4, (day.count / maxInTrend) * 100)}%`,
                    opacity: day.count === 0 ? 0.18 : 1,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[0.65rem] text-fg-subtle">
              <span>{trend[0]?.date.slice(5)}</span>
              <span>{trend.at(-1)?.date.slice(5)}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium">Ask your work history</h3>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              The private assistant answers from your own tasks — what you shipped
              last week, what is still open, what you learned about a topic.
            </p>
            <ButtonLink href="/dashboard/assistant" size="sm" className="mt-4 w-full">
              Open assistant
            </ButtonLink>
          </Card>
        </aside>
      </div>
    </DashboardPage>
  );
}
