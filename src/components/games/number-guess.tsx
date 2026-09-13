"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, PartyPopper, RotateCcw } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import { useStoredNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const RANGES = {
  easy: { max: 100, label: "1 – 100", optimal: 7 },
  medium: { max: 500, label: "1 – 500", optimal: 9 },
  hard: { max: 1000, label: "1 – 1000", optimal: 10 },
} as const;

type Level = keyof typeof RANGES;
type Guess = { value: number; direction: "low" | "high" | "correct" };

export function NumberGuess() {
  const [level, setLevel] = useState<Level>("easy");
  const [target, setTarget] = useState(() =>
    Math.floor(Math.random() * RANGES.easy.max) + 1,
  );
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [best, setBest] = useStoredNumber(`guess:best:${level}`, 0);
  const inputRef = useRef<HTMLInputElement>(null);

  const won = guesses.at(-1)?.direction === "correct";
  const range = RANGES[level];

  const reset = useCallback((next: Level = level) => {
    setTarget(Math.floor(Math.random() * RANGES[next].max) + 1);
    setGuesses([]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }, [level]);

  // Record the best (lowest) number of guesses once a round is won.
  useEffect(() => {
    if (!won) return;
    const used = guesses.length;
    if (best === 0 || used < best) setBest(used);
  }, [won, guesses.length, best, setBest]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (won) return;

    const value = Number(input);
    if (!Number.isInteger(value) || value < 1 || value > range.max) {
      setError(`Enter a whole number between 1 and ${range.max}.`);
      return;
    }
    if (guesses.some((g) => g.value === value)) {
      setError("You already tried that one.");
      return;
    }

    setError(null);
    setInput("");
    setGuesses((g) => [
      ...g,
      {
        value,
        direction: value === target ? "correct" : value < target ? "low" : "high",
      },
    ]);
  }

  // Narrow the displayed bounds from the guesses so far. The explicit
  // <number> matters: without it TypeScript picks the overload where the
  // accumulator is the element type and infers `Guess` instead.
  const lower = guesses.reduce<number>(
    (lo, g) => (g.direction === "low" ? Math.max(lo, g.value + 1) : lo),
    1,
  );
  const upper = guesses.reduce<number>(
    (hi, g) => (g.direction === "high" ? Math.min(hi, g.value - 1) : hi),
    range.max,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-6 sm:p-8">
        {won ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-success/30 bg-success/10 text-success">
              <PartyPopper className="h-5 w-5" />
            </span>
            <p className="mt-5 text-2xl font-semibold">It was {target}</p>
            <p className="mt-2 text-sm text-fg-muted">
              Found in {guesses.length} guess{guesses.length === 1 ? "" : "es"}.
              {guesses.length <= range.optimal
                ? " That is optimal or better than binary search would manage."
                : ` Binary search would need about ${range.optimal}.`}
            </p>
            <Button className="mt-7" onClick={() => reset()}>
              <RotateCcw className="h-4 w-4" />
              Play again
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">
                Range remaining
              </p>
              <p className="mt-3 font-mono text-3xl font-semibold text-accent sm:text-4xl">
                {lower} – {upper}
              </p>
              <p className="mt-2 text-sm text-fg-subtle">
                {guesses.length} guess{guesses.length === 1 ? "" : "es"} so far
              </p>
            </div>

            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xs gap-2">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                min={1}
                max={range.max}
                placeholder="Your guess"
                aria-label="Your guess"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-center text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
              <Button type="submit" disabled={!input}>
                Guess
              </Button>
            </form>

            {error ? (
              <p role="alert" className="mt-3 text-center text-xs text-danger">
                {error}
              </p>
            ) : null}

            {guesses.length > 0 ? (
              <ul className="mt-8 space-y-2">
                {[...guesses].reverse().map((guess) => (
                  <li
                    key={guess.value}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm",
                      guess.direction === "low"
                        ? "border-border bg-surface-2 text-fg-muted"
                        : "border-border bg-surface-2 text-fg-muted",
                    )}
                  >
                    <span className="font-mono font-semibold text-fg">
                      {guess.value}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      {guess.direction === "low" ? (
                        <>
                          <ArrowUp className="h-3 w-3 text-warning" aria-hidden />
                          Too low
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3 text-warning" aria-hidden />
                          Too high
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Range
          </p>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(RANGES) as Level[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLevel(l);
                  reset(l);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  level === l
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2",
                )}
              >
                {RANGES[l].label}
              </button>
            ))}
          </div>
        </Card>

        {best > 0 ? (
          <Card className="p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              Fewest guesses
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent">{best}</p>
          </Card>
        ) : null}

        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-subtle">
            Halving the remaining range each time is binary search — it finds any
            number in {range.label} within about {range.optimal} guesses. The
            range display updates so you can see the search space shrink.
          </p>
        </Card>
      </div>
    </div>
  );
}
