"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import { useStoredNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Memory matching, themed on the stack this site is built with — so the cards
 * are worth reading rather than being abstract shapes.
 */
const SYMBOLS = [
  "RAG", "MCP", "LLM", "SFT", "BM25", "HyDE", "FAISS", "LoRA",
  "Neo4j", "Qdrant", "Redis", "Optuna",
];

const DIFFICULTIES = {
  easy: { pairs: 6, cols: "grid-cols-4", label: "Easy" },
  medium: { pairs: 8, cols: "grid-cols-4", label: "Medium" },
  hard: { pairs: 12, cols: "grid-cols-6", label: "Hard" },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;

type CardState = { id: number; symbol: string; matched: boolean };

function buildDeck(pairs: number): CardState[] {
  const chosen = SYMBOLS.slice(0, pairs);
  const deck = [...chosen, ...chosen].map((symbol, id) => ({
    id,
    symbol,
    matched: false,
  }));

  // Fisher-Yates.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}

export function Memory() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [deck, setDeck] = useState<CardState[]>(() => buildDeck(DIFFICULTIES.medium.pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const [storedBest, setStoredBest] = useStoredNumber(
    `memory:best:${difficulty}`,
    0,
  );

  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const won = deck.length > 0 && deck.every((card) => card.matched);

  const reset = useCallback(
    (level: Difficulty = difficulty) => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
      setDeck(buildDeck(DIFFICULTIES[level].pairs));
      setFlipped([]);
      setMoves(0);
      setLocked(false);
    },
    [difficulty],
  );

  // Record a new best when the board is cleared.
  useEffect(() => {
    if (!won || moves === 0) return;
    if (storedBest === 0 || moves < storedBest) setStoredBest(moves);
  }, [won, moves, storedBest, setStoredBest]);

  useEffect(() => () => {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
  }, []);

  function flip(index: number) {
    if (locked || won) return;
    const card = deck[index];
    if (!card || card.matched || flipped.includes(index)) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length < 2) return;

    setMoves((m) => m + 1);
    setLocked(true);

    const [a, b] = next as [number, number];
    const isMatch = deck[a]!.symbol === deck[b]!.symbol;

    // Both outcomes pause briefly so the second card is actually readable.
    resolveTimer.current = setTimeout(
      () => {
        if (isMatch) {
          setDeck((d) =>
            d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
          );
        }
        setFlipped([]);
        setLocked(false);
      },
      isMatch ? 340 : 780,
    );
  }

  const config = DIFFICULTIES[difficulty];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-5 text-sm">
            <p>
              <span className="text-fg-subtle">Moves </span>
              <span className="font-mono text-base font-semibold text-accent">
                {moves}
              </span>
            </p>
            {storedBest > 0 ? (
              <p>
                <span className="text-fg-subtle">Best </span>
                <span className="font-mono text-base font-semibold">{storedBest}</span>
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={() => reset()}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </Button>
        </div>

        <div className={cn("grid gap-2 sm:gap-2.5", config.cols)}>
          {deck.map((card, index) => {
            const isUp = card.matched || flipped.includes(index);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flip(index)}
                disabled={card.matched || locked}
                aria-label={isUp ? card.symbol : "Hidden card"}
                className={cn(
                  "aspect-[3/4] rounded-xl border text-xs font-semibold transition-all duration-300 sm:text-sm",
                  isUp
                    ? card.matched
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-accent/40 bg-accent-soft text-accent"
                    : "border-border bg-surface-2 text-transparent hover:border-border-strong",
                  !isUp && "[transform:rotateY(0deg)]",
                )}
              >
                {isUp ? card.symbol : "?"}
              </button>
            );
          })}
        </div>

        {won ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success"
          >
            Cleared in {moves} moves
            {storedBest > 0 && moves <= storedBest ? " — a new best." : "."}
          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Difficulty
          </p>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setDifficulty(level);
                  reset(level);
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  difficulty === level
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2",
                )}
              >
                {DIFFICULTIES[level].label}
                <span className="font-mono text-xs text-fg-subtle">
                  {DIFFICULTIES[level].pairs} pairs
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-subtle">
            Match the pairs in as few moves as possible. The cards are terms from
            the AI stack this site is built on. Your best score per difficulty is
            saved in this browser.
          </p>
        </Card>
      </div>
    </div>
  );
}
