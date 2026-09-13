"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Flag, RotateCcw, Undo2 } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Chess against a computer opponent.
 *
 * Move legality, check, checkmate, stalemate, castling, en passant and
 * promotion all come from chess.js — rewriting that by hand would be a large
 * pile of subtly wrong edge cases. What is implemented here is the opponent:
 * a negamax search over material plus piece-square placement.
 */

const PIECES: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/**
 * A light central-control bonus, from White's point of view. Without it the
 * engine develops aimlessly, because pure material sees no difference between
 * a knight on the rim and one in the centre.
 */
const CENTRALITY = [
  [0, 1, 2, 3, 3, 2, 1, 0],
  [1, 2, 3, 4, 4, 3, 2, 1],
  [2, 3, 4, 5, 5, 4, 3, 2],
  [3, 4, 5, 6, 6, 5, 4, 3],
  [3, 4, 5, 6, 6, 5, 4, 3],
  [2, 3, 4, 5, 5, 4, 3, 2],
  [1, 2, 3, 4, 4, 3, 2, 1],
  [0, 1, 2, 3, 3, 2, 1, 0],
];

const DIFFICULTIES = {
  easy: { depth: 1, label: "Easy", note: "one move ahead" },
  medium: { depth: 2, label: "Medium", note: "two moves ahead" },
  hard: { depth: 3, label: "Hard", note: "three moves ahead" },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;

/** Board score from the side-to-move's perspective. */
function evaluate(game: Chess): number {
  if (game.isCheckmate()) return -100_000;
  if (game.isDraw() || game.isStalemate()) return 0;

  let score = 0;
  const board = game.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank]![file];
      if (!piece) continue;
      const value = VALUES[piece.type]! + CENTRALITY[rank]![file]! * 2;
      score += piece.color === "w" ? value : -value;
    }
  }

  return game.turn() === "w" ? score : -score;
}

/** Negamax with alpha-beta pruning. */
function search(game: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || game.isGameOver()) return evaluate(game);

  let best = -Infinity;
  // Captures first — better ordering means more of the tree gets pruned.
  const moves = game
    .moves({ verbose: true })
    .sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  for (const move of moves) {
    game.move(move);
    const score = -search(game, depth - 1, -beta, -alpha);
    game.undo();

    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  return best;
}

function chooseMove(fen: string, depth: number): Move | null {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let best: Move | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    game.move(move);
    // A touch of noise keeps equal-valued openings from repeating every game.
    const score = -search(game, depth - 1, -Infinity, Infinity) + Math.random();
    game.undo();

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}

export function ChessGame() {
  const gameRef = useRef(new Chess());
  // Seeded from a throwaway instance rather than the ref: reading a ref during
  // render is disallowed, and a fresh Chess() is the same starting position.
  const [fen, setFen] = useState(() => new Chess().fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [thinking, setThinking] = useState(false);
  const [resigned, setResigned] = useState(false);

  const game = useMemo(() => new Chess(fen), [fen]);

  const legalTargets = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(
      game.moves({ square: selected, verbose: true }).map((m) => m.to),
    );
  }, [selected, game]);

  const isPlayerTurn = game.turn() === "w" && !game.isGameOver() && !resigned;
  const lastMove = game.history({ verbose: true }).at(-1);

  const sync = useCallback(() => setFen(gameRef.current.fen()), []);

  /* ------------------------------------------------------- engine turn */
  useEffect(() => {
    if (resigned) return;
    const current = gameRef.current;
    if (current.turn() !== "b" || current.isGameOver()) return;

    setThinking(true);
    // Deferred so the player's move paints before the search blocks the thread.
    const timer = setTimeout(() => {
      const move = chooseMove(current.fen(), DIFFICULTIES[difficulty].depth);
      if (move) current.move(move);
      sync();
      setThinking(false);
    }, 260);

    return () => clearTimeout(timer);
  }, [fen, difficulty, resigned, sync]);

  function onSquare(square: Square) {
    if (!isPlayerTurn || thinking) return;

    const piece = gameRef.current.get(square);

    // Selecting or re-selecting one of your own pieces.
    if (piece && piece.color === "w") {
      setSelected(square);
      return;
    }

    if (!selected) return;

    try {
      // Always promote to queen — an under-promotion picker is noise here.
      gameRef.current.move({ from: selected, to: square, promotion: "q" });
      setSelected(null);
      sync();
    } catch {
      // Illegal target: clear the selection rather than leaving it stuck.
      setSelected(null);
    }
  }

  function reset() {
    gameRef.current = new Chess();
    setSelected(null);
    setResigned(false);
    setThinking(false);
    sync();
  }

  function undo() {
    if (thinking) return;
    // Undo the pair, so it returns to the player's turn rather than the engine's.
    gameRef.current.undo();
    gameRef.current.undo();
    setSelected(null);
    sync();
  }

  const status = resigned
    ? "You resigned"
    : game.isCheckmate()
      ? game.turn() === "w"
        ? "Checkmate — the engine wins"
        : "Checkmate — you win"
      : game.isStalemate()
        ? "Stalemate"
        : game.isDraw()
          ? "Draw"
          : game.inCheck()
            ? game.turn() === "w"
              ? "You are in check"
              : "Engine is in check"
            : thinking
              ? "Engine thinking…"
              : "Your move";

  const captured = game
    .history({ verbose: true })
    .filter((m) => m.captured)
    .reduce<{ byWhite: string[]; byBlack: string[] }>(
      (acc, m) => {
        const symbol = PIECES[`${m.color === "w" ? "b" : "w"}${m.captured}`]!;
        if (m.color === "w") acc.byWhite.push(symbol);
        else acc.byBlack.push(symbol);
        return acc;
      },
      { byWhite: [], byBlack: [] },
    );

  const board = game.board();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p
            aria-live="polite"
            className={cn(
              "text-sm font-medium",
              game.isCheckmate() && game.turn() === "b" && "text-success",
              game.isCheckmate() && game.turn() === "w" && "text-danger",
              game.inCheck() && !game.isCheckmate() && "text-warning",
            )}
          >
            {status}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={game.history().length < 2 || thinking}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              New game
            </Button>
          </div>
        </div>

        {/* Captured by the engine, shown above the board it faces. */}
        <div className="mb-2 min-h-6 text-lg leading-none text-fg-subtle">
          {captured.byBlack.join(" ")}
        </div>

        <div className="mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-lg border border-border">
          <div className="grid h-full w-full grid-cols-8">
            {board.map((row, rank) =>
              row.map((piece, file) => {
                const square = `${"abcdefgh"[file]}${8 - rank}` as Square;
                const isDark = (rank + file) % 2 === 1;
                const isSelected = selected === square;
                const isTarget = legalTargets.has(square);
                const isLast = lastMove?.from === square || lastMove?.to === square;

                return (
                  <button
                    key={square}
                    type="button"
                    onClick={() => onSquare(square)}
                    disabled={!isPlayerTurn}
                    aria-label={`${square}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ", empty"}`}
                    className={cn(
                      "relative grid place-items-center text-[clamp(1.4rem,5vw,2.6rem)] leading-none transition-colors",
                      isDark ? "bg-surface-2" : "bg-surface",
                      isLast && "bg-warning/15",
                      isSelected && "bg-accent/30",
                      isTarget && "after:absolute after:h-3 after:w-3 after:rounded-full after:bg-accent/50",
                      piece && isTarget && "after:h-full after:w-full after:rounded-none after:bg-danger/20",
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10",
                        piece?.color === "w" ? "text-fg" : "text-fg-muted",
                      )}
                    >
                      {piece ? PIECES[`${piece.color}${piece.type}`] : ""}
                    </span>
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <div className="mt-2 min-h-6 text-lg leading-none text-fg-subtle">
          {captured.byWhite.join(" ")}
        </div>

        {!game.isGameOver() && !resigned ? (
          <button
            type="button"
            onClick={() => setResigned(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-subtle transition-colors hover:text-danger"
          >
            <Flag className="h-3 w-3" aria-hidden />
            Resign
          </button>
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
                onClick={() => setDifficulty(level)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  difficulty === level
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2",
                )}
              >
                {DIFFICULTIES[level].label}
                <span className="text-xs text-fg-subtle">
                  {DIFFICULTIES[level].note}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Moves
          </p>
          {game.history().length > 0 ? (
            <ol className="max-h-52 space-y-0.5 overflow-y-auto font-mono text-xs text-fg-muted">
              {Array.from(
                { length: Math.ceil(game.history().length / 2) },
                (_, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 shrink-0 text-fg-subtle">{i + 1}.</span>
                    <span className="w-14">{game.history()[i * 2]}</span>
                    <span>{game.history()[i * 2 + 1] ?? ""}</span>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <p className="text-xs text-fg-subtle">No moves yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="outline">You are white</Badge>
          </div>
          <p className="text-xs leading-relaxed text-fg-subtle">
            Tap a piece, then a highlighted square. Rules come from chess.js —
            castling, en passant and promotion all work. Pawns promote to a queen
            automatically.
          </p>
        </Card>
      </div>
    </div>
  );
}
