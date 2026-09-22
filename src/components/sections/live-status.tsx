"use client";

import { useEffect, useState } from "react";
import { Bot, Database, Mic, Radio } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Status = {
  assistant: string;
  voice: string;
  workspace: string;
};

const services = [
  { key: "assistant", label: "AI Assistant", icon: Bot, up: "online" },
  { key: "voice", label: "Voice Agent", icon: Mic, up: "enabled" },
  { key: "workspace", label: "Workspace", icon: Database, up: "connected" },
] as const;

/**
 * Reads /api/status and reports what is actually running.
 *
 * Fetched in the browser rather than at build time on purpose: a status panel
 * baked into a static page is a claim with a green dot next to it. This one
 * goes grey when a service is genuinely down.
 *
 * Renders nothing until the first response resolves — a panel that flashed
 * "offline" before it knew would be lying in the other direction — and owns
 * its own spacing so that empty state occupies no room.
 */
export function LiveStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/status", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Status) => setStatus(data))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, []);

  if (!status || failed) return null;

  return (
    <div className="container-px pt-12 sm:pt-16">
      <Card className="mx-auto max-w-3xl overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border bg-surface-2/60 px-5 py-3">
          <span className="relative grid h-4 w-4 place-items-center">
            <span className="absolute h-2.5 w-2.5 rounded-full bg-success animate-pulse-ring" />
            <span className="h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg">
            Live systems
          </p>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-fg-subtle">
            <Radio className="h-3 w-3" aria-hidden />
            reading this deployment
          </span>
        </div>

        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {services.map((service) => {
            const value = status[service.key];
            const isUp = value === service.up;
            const Icon = service.icon;

            return (
              <div key={service.key} className="flex items-center gap-3 px-5 py-4">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                    isUp
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-surface-2 text-fg-subtle",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{service.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-xs capitalize",
                      isUp ? "text-success" : "text-fg-subtle",
                    )}
                  >
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border bg-surface-2/60 px-5 py-3">
          <p className="text-xs text-fg-subtle">
            Model calls run server-side — the API key never reaches your browser.
          </p>
        </div>
      </Card>
    </div>
  );
}
