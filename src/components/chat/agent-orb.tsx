"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The assistant's launcher: a living orb rather than a static button.
 *
 * Three layers of motion, all CSS so nothing runs on the main thread — a
 * breathing gradient core, two orbiting rings at different speeds, and a
 * ripple that fires on an interval. Together they read as "something is
 * running here", which a flat circle with an icon does not.
 *
 * It also surfaces an invitation after a delay, once, so a visitor who has
 * not noticed the orb learns it can be talked to. Dismissing it is permanent
 * for the session; nagging is worse than being missed.
 */
export function AgentOrb({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [invite, setInvite] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (open || dismissed) return;
    // Long enough that it arrives after the visitor has started reading.
    const timer = setTimeout(() => setInvite(true), 7000);
    return () => clearTimeout(timer);
  }, [open, dismissed]);

  /** Opening the panel retires the invitation for good. */
  function handleToggle() {
    setInvite(false);
    setDismissed(true);
    onToggle();
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-end gap-3",
        open && "pointer-events-none opacity-0",
      )}
    >
      {/* ------------------------------------------------- invitation */}
      {invite && !open ? (
        <div className="mb-1 flex max-w-[15rem] items-start gap-2 rounded-2xl rounded-br-md border border-border bg-surface px-4 py-3 shadow-lg animate-rise">
          <p className="text-sm leading-snug text-fg-muted">
            Ask me anything about Sai Kiran&apos;s work — I answer from his
            real portfolio.
          </p>
          <button
            type="button"
            onClick={() => {
              setInvite(false);
              setDismissed(true);
            }}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-fg-subtle transition-colors hover:text-fg"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      {/* -------------------------------------------------------- orb */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open AI assistant"
        className="group relative grid h-16 w-16 place-items-center rounded-full"
      >
        {/* Outer ring — slow orbit. */}
        <span
          aria-hidden
          className="absolute inset-0 animate-orbit-slow rounded-full border border-dashed border-accent/40"
        />
        {/* Inner ring — faster, opposite direction. */}
        <span
          aria-hidden
          className="absolute inset-[6px] animate-orbit-fast rounded-full border border-accent-2/40"
        />
        {/* Ripple. */}
        <span
          aria-hidden
          className="absolute inset-2 rounded-full bg-accent/30 animate-pulse-ring"
        />

        {/* Breathing gradient core. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-[10px] rounded-full animate-breathe",
            "bg-[conic-gradient(from_0deg,var(--accent),var(--accent-2),var(--accent))]",
            "shadow-[0_0_28px_-4px_var(--glow)]",
            "transition-transform duration-300 group-hover:scale-110",
          )}
        />

        <Sparkles className="relative h-5 w-5 text-accent-fg" />

        {/* Live dot, so it reads as running rather than decorative. */}
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-bg bg-success"
        />
      </button>
    </div>
  );
}
