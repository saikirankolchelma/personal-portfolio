"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, Database, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = {
  assistant: string;
  voice: string;
  workspace: string;
  model: string | null;
};

const services = [
  { key: "assistant", label: "AI assistant", icon: Bot, up: "online" },
  { key: "voice", label: "Voice agent", icon: Mic, up: "enabled" },
  { key: "workspace", label: "Workspace", icon: Database, up: "connected" },
] as const;

/**
 * Reads /api/status and reports what is actually running.
 *
 * Fetched in the browser rather than at build time on purpose: a status strip
 * baked into a static page is just a claim with a green dot next to it. This
 * one goes grey if the service is genuinely down.
 *
 * Renders nothing at all until the fetch resolves — a strip that flashes
 * "offline" before its first response would be lying in the other direction.
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

  // Nothing to say yet, and nothing worth saying if the check itself failed.
  if (!status || failed) return null;

  return (
    <div className="container-px flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-10 sm:pt-14">
      <span className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-subtle">
        <Activity className="h-3.5 w-3.5" aria-hidden />
        Live
      </span>

      {services.map((service) => {
        const value = status[service.key];
        const isUp = value === service.up;
        const Icon = service.icon;

        return (
          <span
            key={service.key}
            className="flex items-center gap-2 text-xs text-fg-muted"
            title={`${service.label}: ${value}`}
          >
            <span className="relative grid h-2.5 w-2.5 place-items-center">
              {isUp ? (
                <span className="absolute h-2 w-2 rounded-full bg-success animate-pulse-ring" />
              ) : null}
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isUp ? "bg-success" : "bg-fg-subtle",
                )}
              />
            </span>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {service.label}
          </span>
        );
      })}

      {status.model ? (
        <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[0.7rem] text-fg-subtle">
          {status.model}
        </span>
      ) : null}
    </div>
  );
}
