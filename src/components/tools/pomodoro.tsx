"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Settings2, Target } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Mode = "focus" | "short" | "long";

const MODE_META: Record<Mode, { label: string; icon: typeof Target; tone: string }> = {
  focus: { label: "Focus", icon: Target, tone: "text-accent" },
  short: { label: "Short break", icon: Coffee, tone: "text-success" },
  long: { label: "Long break", icon: Coffee, tone: "text-accent-2" },
};

const DEFAULT_DURATIONS: Record<Mode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

/** Long break after every N completed focus sessions. */
const LONG_BREAK_EVERY = 4;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A short chime via the Web Audio API — no asset to load, and it stays silent
 * rather than throwing if the browser blocks audio.
 */
function playChime() {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.45);
    });

    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* audio unavailable — the visual state change is enough */
  }
}

export function Pomodoro() {
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Deadline-based countdown: a background tab throttling setInterval cannot
  // make the timer drift, because elapsed time is read from the clock.
  const deadline = useRef<number | null>(null);

  const switchMode = useCallback(
    (next: Mode, autoStart = false) => {
      setMode(next);
      setRemaining(durations[next] * 60);
      setRunning(autoStart);
      deadline.current = autoStart ? Date.now() + durations[next] * 60 * 1000 : null;
    },
    [durations],
  );

  useEffect(() => {
    if (!running) return;

    if (deadline.current === null) {
      deadline.current = Date.now() + remaining * 1000;
    }

    const tick = setInterval(() => {
      const left = Math.max(
        0,
        Math.round(((deadline.current ?? Date.now()) - Date.now()) / 1000),
      );
      setRemaining(left);

      if (left === 0) {
        clearInterval(tick);
        deadline.current = null;
        setRunning(false);
        playChime();

        if (mode === "focus") {
          const done = completed + 1;
          setCompleted(done);
          switchMode(done % LONG_BREAK_EVERY === 0 ? "long" : "short");
        } else {
          switchMode("focus");
        }
      }
    }, 250);

    return () => clearInterval(tick);
    // `remaining` is deliberately excluded — it changes every tick and would
    // otherwise rebuild the interval continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, completed, switchMode]);

  function toggle() {
    setRunning((r) => {
      if (r) {
        deadline.current = null;
        return false;
      }
      deadline.current = Date.now() + remaining * 1000;
      return true;
    });
  }

  function reset() {
    deadline.current = null;
    setRunning(false);
    setRemaining(durations[mode] * 60);
  }

  function updateDuration(target: Mode, minutes: number) {
    const clamped = Math.min(120, Math.max(1, minutes || 1));
    setDurations((d) => ({ ...d, [target]: clamped }));
    if (target === mode && !running) {
      setRemaining(clamped * 60);
      deadline.current = null;
    }
  }

  const total = durations[mode] * 60;
  const progress = total > 0 ? 1 - remaining / total : 0;
  const Icon = MODE_META[mode].icon;

  // SVG progress ring geometry.
  const radius = 130;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-6 sm:p-10">
        <div className="mb-8 flex justify-center gap-2">
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                mode === m
                  ? "bg-accent-soft text-accent"
                  : "text-fg-muted hover:bg-surface-2",
              )}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[19rem]">
          <svg viewBox="0 0 300 300" className="h-full w-full -rotate-90">
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 grid place-content-center text-center">
            <Icon className={cn("mx-auto h-5 w-5", MODE_META[mode].tone)} aria-hidden />
            <p
              aria-live="polite"
              className="mt-3 font-mono text-5xl font-semibold tabular-nums sm:text-6xl"
            >
              {formatTime(remaining)}
            </p>
            <p className="mt-2 text-sm text-fg-subtle">{MODE_META[mode].label}</p>
          </div>
        </div>

        <div className="mt-9 flex justify-center gap-3">
          <Button size="lg" onClick={toggle}>
            {running ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button variant="secondary" size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Sessions today
          </p>
          <p className="text-3xl font-semibold text-accent">{completed}</p>
          <p className="mt-1.5 text-xs text-fg-subtle">
            Focus sessions completed. A long break arrives every{" "}
            {LONG_BREAK_EVERY}.
          </p>
          {completed > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Array.from({ length: Math.min(completed, 12) }, (_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-accent" />
              ))}
              {completed > 12 ? (
                <span className="text-xs text-fg-subtle">+{completed - 12}</span>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={showSettings}
          >
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              Durations
            </span>
            <Settings2 className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
          </button>

          {showSettings ? (
            <div className="mt-4 space-y-3">
              {(Object.keys(MODE_META) as Mode[]).map((m) => (
                <div key={m} className="flex items-center justify-between gap-3">
                  <label htmlFor={`duration-${m}`} className="text-sm text-fg-muted">
                    {MODE_META[m].label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`duration-${m}`}
                      type="number"
                      min={1}
                      max={120}
                      value={durations[m]}
                      onChange={(e) => updateDuration(m, Number(e.target.value))}
                      className="w-16 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
                    />
                    <span className="text-xs text-fg-subtle">min</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-fg-subtle">
              {durations.focus} / {durations.short} / {durations.long} min
            </p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-subtle">
            The countdown runs off the system clock, so it stays accurate even
            if this tab is backgrounded. A chime plays when a session ends.
          </p>
        </Card>
      </div>
    </div>
  );
}
