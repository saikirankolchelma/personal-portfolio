"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import { useStoredNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Typing speed test.
 *
 * WPM uses the standard definition — 5 characters per "word", counted over
 * correctly typed characters — so the number is comparable with other tests
 * rather than flattering.
 */

const PASSAGES = [
  "Retrieval augmented generation works well until the answer lives between records rather than inside one of them. That is the point where a knowledge graph stops being overhead and starts being the only honest model of the domain.",
  "The interesting part of an agent is not the prompt. It is what happens when a tool call fails, when the schema has drifted since yesterday, and when the model confidently answers a question it should have refused.",
  "Routing every query to the largest model is a decision, not a default. Most questions are lookups. Paying multi hop reasoning cost for a definition is how an inference budget quietly disappears inside a single quarter.",
  "Evaluation is the part that compounds. Without a labelled set and a judge you can regress against, every prompt change is an opinion, and the system only improves in the direction of whoever argued most recently.",
  "Guardrails are not a feature you add at the end. An agent that can reach real tools and real data will eventually be asked to do something it should not, and the only question is whether anything is watching when it happens.",
];

const DURATIONS = [15, 30, 60] as const;
type Duration = (typeof DURATIONS)[number];

export function TypingTest() {
  const [duration, setDuration] = useState<Duration>(30);
  const [passage, setPassage] = useState(() => PASSAGES[0]!);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(30);
  const [finished, setFinished] = useState(false);

  const [bestWpm, setBestWpm] = useStoredNumber("typing:best-wpm", 0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ------------------------------------------------------------ stats */
  const stats = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === passage[i]) correct++;
    }
    // Derived from the countdown rather than Date.now(): calling an impure
    // function during render is both a lint error and a correctness hazard,
    // since the value would differ between renders of the same state.
    const elapsedSeconds = startedAt === null ? 0 : duration - remaining;
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = elapsedMinutes > 0 ? Math.round(correct / 5 / elapsedMinutes) : 0;
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    return { correct, wpm, accuracy };
  }, [typed, passage, startedAt, duration, remaining]);

  const reset = useCallback(
    (next: Duration = duration) => {
      setPassage(PASSAGES[Math.floor(Math.random() * PASSAGES.length)]!);
      setTyped("");
      setStartedAt(null);
      setRemaining(next);
      setFinished(false);
      inputRef.current?.focus();
    },
    [duration],
  );

  /* ------------------------------------------------------------- timer */
  useEffect(() => {
    if (startedAt === null || finished) return;

    const deadline = startedAt + duration * 1000;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(tick);
        setFinished(true);
      }
    }, 200);

    return () => clearInterval(tick);
  }, [startedAt, duration, finished]);

  // Record a new best once the run is over, not while it fluctuates.
  useEffect(() => {
    if (finished && stats.wpm > bestWpm) setBestWpm(stats.wpm);
  }, [finished, stats.wpm, bestWpm, setBestWpm]);

  function onChange(value: string) {
    if (finished) return;
    if (startedAt === null && value.length > 0) setStartedAt(Date.now());
    // Never let the user type past the passage.
    setTyped(value.slice(0, passage.length));
    if (value.length >= passage.length) setFinished(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-6 text-sm">
            <p>
              <span className="text-fg-subtle">Time </span>
              <span className="font-mono text-base font-semibold text-accent tabular-nums">
                {remaining}s
              </span>
            </p>
            <p>
              <span className="text-fg-subtle">WPM </span>
              <span className="font-mono text-base font-semibold tabular-nums">
                {stats.wpm}
              </span>
            </p>
            <p>
              <span className="text-fg-subtle">Accuracy </span>
              <span className="font-mono text-base font-semibold tabular-nums">
                {stats.accuracy}%
              </span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => reset()}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </Button>
        </div>

        {/* The passage, coloured per character against what has been typed. */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="cursor-text select-none rounded-xl border border-border bg-surface-2 p-5 font-mono text-base leading-loose sm:text-lg"
        >
          {passage.split("").map((char, i) => {
            const typedChar = typed[i];
            const isCursor = i === typed.length && !finished;
            return (
              <span
                key={i}
                className={cn(
                  typedChar === undefined && "text-fg-subtle",
                  typedChar !== undefined && typedChar === char && "text-success",
                  typedChar !== undefined &&
                    typedChar !== char &&
                    "rounded bg-danger/20 text-danger",
                  isCursor && "border-l-2 border-accent",
                )}
              >
                {char}
              </span>
            );
          })}
        </div>

        <textarea
          ref={inputRef}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          disabled={finished}
          aria-label="Type the passage above"
          placeholder={startedAt === null ? "Start typing to begin…" : ""}
          rows={3}
          className="mt-4 w-full resize-none rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none disabled:opacity-60"
        />

        {finished ? (
          <div
            role="status"
            className="mt-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-center text-sm text-accent"
          >
            {stats.wpm} WPM at {stats.accuracy}% accuracy
            {stats.wpm >= bestWpm && stats.wpm > 0 ? " — a new best." : "."}
          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Duration
          </p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDuration(d);
                  reset(d);
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm transition-colors",
                  duration === d
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2",
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </Card>

        {bestWpm > 0 ? (
          <Card className="p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              Personal best
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent">{bestWpm}</p>
            <p className="mt-0.5 text-xs text-fg-subtle">words per minute</p>
          </Card>
        ) : null}

        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-subtle">
            WPM counts correctly typed characters divided by five — the standard
            definition, so it is comparable with other tests. Mistakes stay
            visible rather than being auto-corrected.
          </p>
        </Card>
      </div>
    </div>
  );
}
