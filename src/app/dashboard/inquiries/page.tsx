import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Building2, Mail, Reply, ShieldAlert } from "lucide-react";

import { Badge, Card } from "@/components/ui/primitives";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SetupNotice,
} from "@/components/dashboard/shell";
import { isDatabaseConfigured } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { inquiryCounts, listInquiries } from "@/lib/data/inquiries";
import { setInquiryStatusAction } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";

const statusTone = {
  NEW: "accent",
  READ: "default",
  REPLIED: "success",
  ARCHIVED: "outline",
  SPAM: "danger",
} as const;

type Status = keyof typeof statusTone;

function StatusAction({
  id,
  status,
  label,
  icon: Icon,
}: {
  id: string;
  status: Status;
  label: string;
  icon: typeof Reply;
}) {
  return (
    <form action={setInquiryStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </button>
    </form>
  );
}

export default async function InquiriesPage(
  props: PageProps<"/dashboard/inquiries">,
) {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Inquiries" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  await requireUserId();
  const searchParams = await props.searchParams;
  const raw = searchParams.status;
  const filter =
    typeof raw === "string" && raw in statusTone ? (raw as Status) : undefined;

  const [inquiries, counts] = await Promise.all([
    listInquiries(filter),
    inquiryCounts(),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Inquiries"
        description="Freelance project inquiries submitted from the public site."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/inquiries"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
            !filter
              ? "border-accent/40 bg-accent-soft text-accent"
              : "border-border text-fg-muted hover:text-fg",
          )}
        >
          All
        </Link>
        {(Object.keys(statusTone) as Status[]).map((status) => (
          <Link
            key={status}
            href={`/dashboard/inquiries?status=${status}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors",
              filter === status
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border text-fg-muted hover:text-fg",
            )}
          >
            {status.toLowerCase()}
            <span className="font-mono text-xs text-fg-subtle">
              {counts[status]}
            </span>
          </Link>
        ))}
      </div>

      {inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-base font-semibold">{inquiry.name}</h2>
                    <Badge tone={statusTone[inquiry.status]}>
                      {inquiry.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="flex items-center gap-1.5 text-accent hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      {inquiry.email}
                    </a>
                    {inquiry.company ? (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" aria-hidden />
                        {inquiry.company}
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="shrink-0 font-mono text-xs text-fg-subtle">
                  {inquiry.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-3">
                {[
                  ["Project type", inquiry.projectType],
                  ["Budget", inquiry.budgetRange ?? "Not stated"],
                  ["Timeline", inquiry.timeline ?? "Not stated"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-subtle">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-lg border border-border bg-surface-2 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                  {inquiry.description}
                </p>
                {inquiry.requirements ? (
                  <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm leading-relaxed text-fg-subtle">
                    {inquiry.requirements}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                <StatusAction
                  id={inquiry.id}
                  status="REPLIED"
                  label="Replied"
                  icon={Reply}
                />
                <StatusAction
                  id={inquiry.id}
                  status="ARCHIVED"
                  label="Archive"
                  icon={Archive}
                />
                <StatusAction
                  id={inquiry.id}
                  status="SPAM"
                  label="Spam"
                  icon={ShieldAlert}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No inquiries"
          description={
            filter
              ? "Nothing with that status yet."
              : "Inquiries submitted through the freelance form will appear here."
          }
        />
      )}
    </DashboardPage>
  );
}
