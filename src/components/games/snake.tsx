"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { useStoredNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const GRID = 17;
const START_SPEED = 170;
const MIN_SPEED = 70;
const STORAGE_KEY = "snake:high-score";

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Phase = "idle" | "running" | "paused" | "over";

/** The whole game lives in one state object, so every tick is a single
 *  pure update — no setState calls reaching across each other. */
type Game = {
  snake: Point[];
  food: Point;
  score: number;
  phase: Phase;
};

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
];

function randomFood(snake: Point[]): Point {
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
}

function newGame(phase: Phase): Game {
  return {
    snake: INITIAL_SNAKE,
    food: randomFood(INITIAL_SNAKE),
    score: 0,
    phase,
  };
}

export function Snake() {
  const [game, setGame] = useState<Game>(() => newGame("idle"));
  const [highScore, setHighScore] = useStoredNumber(STORAGE_KEY, 0);

  // Direction lives in refs so input is read by the next tick without
  // rebuilding the interval on every key press.
  const direction = useRef<Direction>("right");
  const queued = useRef<Direction | null>(null);

  const { snake, food, score, phase } = game;

  const reset = useCallback(() => {
    direction.current = "right";
    queued.current = null;
    setGame(newGame("running"));
  }, []);

  const turn = useCallback((next: Direction) => {
    // Reject reversals against the direction actually being rendered.
    if (OPPOSITE[next] === direction.current) return;
    queued.current = next;
  }, []);

  const togglePause = useCallback(() => {
    setGame((g) =>
      g.phase === "running"
        ? { ...g, phase: "paused" }
        : g.phase === "paused"
          ? { ...g, phase: "running" }
          : g,
    );
  }, []);

  // ---------------------------------------------------------------- tick
  useEffect(() => {
    if (phase !== "running") return;

    const speed = Math.max(MIN_SPEED, START_SPEED - Math.floor(score / 3) * 8);

    const timer = setInterval(() => {
      setGame((g) => {
        if (g.phase !== "running") return g;

        if (queued.current) {
          direction.current = queued.current;
          queued.current = null;
        }

        const vector = VECTORS[direction.current];
        const head = {
          x: g.snake[0]!.x + vector.x,
          y: g.snake[0]!.y + vector.y,
        };

        const hitWall =
          head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
        // The tail cell is vacated this tick, so it is not a collision.
        const hitSelf = g.snake
          .slice(0, -1)
          .some((s) => s.x === head.x && s.y === head.y);

        if (hitWall || hitSelf) return { ...g, phase: "over" };

        const ate = head.x === g.food.x && head.y === g.food.y;
        const nextSnake = [head, ...(ate ? g.snake : g.snake.slice(0, -1))];

        return {
          snake: nextSnake,
          food: ate ? randomFood(nextSnake) : g.food,
          score: g.score + (ate ? 1 : 0),
          phase: "running",
        };
      });
    }, speed);

    return () => clearInterval(timer);
  }, [phase, score]);

  // Persist a new best. This writes to localStorage rather than React state,
  // so it belongs in an effect keyed on the finished game.
  useEffect(() => {
    if (phase === "over" && score > highScore) setHighScore(score);
  }, [phase, score, highScore, setHighScore]);

  // ------------------------------------------------------------- keyboard
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };

    function onKeyDown(event: KeyboardEvent) {
      const next = keyMap[event.key];
      if (next) {
        event.preventDefault();
        if (phase === "idle" || phase === "over") reset();
        turn(next);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, reset, turn, togglePause]);

  // ----------------------------------------------------------------- swipe
  const touchStart = useRef<Point | null>(null);

  function onTouchStart(event: React.TouchEvent) {
    const t = event.touches[0]!;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    const t = event.changedTouches[0]!;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    // Ignore taps; require a deliberate swipe.
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

    if (phase === "idle" || phase === "over") reset();
    turn(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
    touchStart.current = null;
  }

  const headCell = snake[0]!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-5">
            <p className="text-sm">
              <span className="text-fg-subtle">Score </span>
              <span className="font-mono text-base font-semibold text-accent">
                {score}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-fg-subtle">Best </span>
              <span className="font-mono text-base font-semibold">{highScore}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {phase === "running" || phase === "paused" ? (
              <Button variant="ghost" size="sm" onClick={togglePause}>
                {phase === "running" ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </>
                )}
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              {phase === "idle" ? "Start" : "Restart"}
            </Button>
          </div>
        </div>

        <div
          className="relative mx-auto aspect-square w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-border bg-surface-2"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const x = i % GRID;
              const y = Math.floor(i / GRID);
              const isHead = headCell.x === x && headCell.y === y;
              const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={i}
                  className={cn(
                    "m-px rounded-[3px] transition-colors duration-75",
                    isHead && "bg-accent",
                    isBody && "bg-accent/55",
                    isFood && "bg-success",
                  )}
                />
              );
            })}
          </div>

          {phase !== "running" ? (
            <div className="absolute inset-0 grid place-items-center bg-bg/80 backdrop-blur-sm">
              <div className="px-6 text-center">
                <p className="text-lg font-semibold">
                  {phase === "over"
                    ? "Game over"
                    : phase === "paused"
                      ? "Paused"
                      : "Snake"}
                </p>
                <p className="mt-2 text-sm text-fg-muted">
                  {phase === "over"
                    ? `You scored ${score}.`
                    : "Arrow keys or WASD. Swipe on mobile."}
                </p>
                <Button size="sm" className="mt-5" onClick={reset}>
                  {phase === "over" ? "Play again" : "Start game"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="space-y-4">
        {/* Touch D-pad — usable without relying on swipe accuracy. */}
        <Card className="p-5 lg:hidden">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Controls
          </p>
          <div className="mx-auto grid w-40 grid-cols-3 gap-1.5">
            <span />
            <DPad label="Up" onPress={() => turn("up")} />
            <span />
            <DPad label="Left" onPress={() => turn("left")} />
            <span />
            <DPad label="Right" onPress={() => turn("right")} />
            <span />
            <DPad label="Down" onPress={() => turn("down")} />
            <span />
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            How to play
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-fg-subtle">
            <li>Arrow keys or WASD to steer. Space pauses.</li>
            <li>On mobile, swipe anywhere on the board or use the pad.</li>
            <li>Eat the green square to grow. The game speeds up as you do.</li>
            <li>Your best score is saved in this browser only.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function DPad({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="grid aspect-square place-items-center rounded-lg border border-border bg-surface-2 text-xs text-fg-muted active:bg-accent-soft active:text-accent"
    >
      {label === "Up" ? "↑" : label === "Down" ? "↓" : label === "Left" ? "←" : "→"}
    </button>
  );
}
