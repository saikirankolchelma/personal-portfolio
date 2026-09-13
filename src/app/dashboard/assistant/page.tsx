import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/primitives";
import { DashboardPage, PageHeader, SetupNotice } from "@/components/dashboard/shell";
import { WorkChat } from "@/components/dashboard/work-chat";
import { isDatabaseConfigured } from "@/lib/db";
import { isGeminiConfigured } from "@/lib/gemini";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Work assistant" };
export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  if (!isDatabaseConfigured()) {
    return (
      <DashboardPage>
        <PageHeader title="Work assistant" />
        <SetupNotice />
      </DashboardPage>
    );
  }

  await requireUserId();

  return (
    <DashboardPage>
      <PageHeader
        title="Work assistant"
        description="Private, and grounded in your own task history. Separate from the public site assistant, which cannot see any of this."
      />

      {!isGeminiConfigured() ? (
        <Card className="mb-6 flex items-start gap-3 p-5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-medium">Gemini is not configured</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Set <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">GEMINI_API_KEY</code>{" "}
              in <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
              and restart the dev server. Your tasks are still recorded in the
              meantime — only the answering is unavailable.
            </p>
          </div>
        </Card>
      ) : null}

      <WorkChat />
    </DashboardPage>
  );
}
