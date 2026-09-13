"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Cell = "X" | "O" | null;
type Board = Cell[];
type Difficulty = "easy" | "medium" | "impossible";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

const EMPTY: Board = Array(9).fill(null);

/** Returns the winning mark and its line, or null while the game is open. */
function findWinner(board: Board): { mark: "X" | "O"; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a] as "X" | "O", line };
    }
  }
  return null;
}

function openCells(board: Board) {
  return board.reduce<number[]>((acc, cell, i) => (cell ? acc : [...acc, i]), []);
}

/**
 * Minimax with depth preference, so the AI wins as fast as possible and
 * loses as slowly as possible. "O" is the AI.
 */
function minimax(board: Board, isAiTurn: boolean, depth = 0): number {
  const winner = findWinner(board);
  if (winner) return winner.mark === "O" ? 10 - depth : depth - 10;
  const open = openCells(board);
  if (open.length === 0) return 0;

  const scores = open.map((index) => {
    const next = [...board];
    next[index] = isAiTurn ? "O" : "X";
    return minimax(next, !isAiTurn, depth + 1);
  });

  return isAiTurn ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board: Board): number {
  const open = openCells(board);
  let best = open[0]!;
  let bestScore = -Infinity;

  for (const index of open) {
    const next = [...board];
    next[index] = "O";
    const score = minimax(next, false, 1);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  }
  return best;
}

/** Difficulty is the probability that the AI plays its best move. */
const optimalPlayChance: Record<Difficulty, number> = {
  easy: 0.25,
  medium: 0.7,
  impossible: 1,
};

function chooseMove(board: Board, difficulty: Difficulty): number {
  const open = openCells(board);
  if (Math.random() < optimalPlayChance[difficulty]) return bestMove(board);
  return open[Math.floor(Math.random() * open.length)]!;
}

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(EMPTY);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });

  const winner = findWinner(board);
  const isDraw = !winner && openCells(board).length === 0;
  const isOver = Boolean(winner) || isDraw;

  const reset = useCallback(() => {
    setBoard(EMPTY);
    setIsPlayerTurn(true);
  }, []);

  /**
   * Applies a move and tallies the result if it ended the game. Keeping the
   * tally here rather than in an effect means the score updates exactly once
   * per finished game, at the moment the finishing move lands.
   */
  const commit = useCallback((next: Board) => {
    setBoard(next);

    const result = findWinner(next);
    const drawn = !result && openCells(next).length === 0;
    if (!result && !drawn) return;

    setScore((s) => ({
      wins: s.wins + (result?.mark === "X" ? 1 : 0),
      losses: s.losses + (result?.mark === "O" ? 1 : 0),
      draws: s.draws + (drawn ? 1 : 0),
    }));
  }, []);

  // AI move, on a short delay so it reads as a response rather than a jump.
  useEffect(() => {
    if (isPlayerTurn || isOver) return;

    const timer = setTimeout(() => {
      const next = [...board];
      next[chooseMove(board, difficulty)] = "O";
      commit(next);
      setIsPlayerTurn(true);
    }, 420);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, isOver, difficulty, board, commit]);

  function play(index: number) {
    if (board[index] || isOver || !isPlayerTurn) return;
    const next = [...board];
    next[index] = "X";
    commit(next);
    setIsPlayerTurn(false);
  }

  const statusText = winner
    ? winner.mark === "X"
      ? "You win"
      : "AI wins"
    : isDraw
      ? "Draw"
      : isPlayerTurn
        ? "Your turn"
        : "AI thinking…";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:gap-8">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p
            aria-live="polite"
            className={cn(
              "text-sm font-medium",
              winner?.mark === "X" && "text-success",
              winner?.mark === "O" && "text-danger",
            )}
          >
            {statusText}
          </p>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </Button>
        </div>

        <div
          role="grid"
          aria-label="Tic-tac-toe board"
          className="mx-auto grid max-w-sm grid-cols-3 gap-2"
        >
          {board.map((cell, index) => {
            const isWinning = winner?.line.includes(index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => play(index)}
                disabled={Boolean(cell) || isOver || !isPlayerTurn}
                aria-label={`Square ${index + 1}${cell ? `, ${cell}` : ", empty"}`}
                className={cn(
                  "aspect-square rounded-xl border text-3xl font-semibold transition-all duration-200 sm:text-4xl",
                  "disabled:cursor-not-allowed",
                  isWinning
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-border bg-surface-2",
                  !cell && !isOver && isPlayerTurn && "hover:border-accent/40 hover:bg-accent-soft",
                  cell === "X" && !isWinning && "text-fg",
                  cell === "O" && !isWinning && "text-fg-muted",
                )}
              >
                {cell}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Difficulty
          </p>
          <div className="flex flex-col gap-1.5">
            {(["easy", "medium", "impossible"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setDifficulty(level);
                  reset();
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm capitalize transition-colors",
                  difficulty === level
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2",
                )}
              >
                {level}
                {level === "impossible" ? (
                  <span className="ml-2 text-xs text-fg-subtle">never loses</span>
                ) : null}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            This session
          </p>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dd className="text-xl font-semibold text-success">{score.wins}</dd>
              <dt className="mt-0.5 text-xs text-fg-subtle">Won</dt>
            </div>
            <div>
              <dd className="text-xl font-semibold text-fg-muted">{score.draws}</dd>
              <dt className="mt-0.5 text-xs text-fg-subtle">Drew</dt>
            </div>
            <div>
              <dd className="text-xl font-semibold text-danger">{score.losses}</dd>
              <dt className="mt-0.5 text-xs text-fg-subtle">Lost</dt>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-subtle">
            You are X and move first. On <strong className="text-fg-muted">impossible</strong>,
            the AI searches the full game tree with minimax — the best you can
            do is force a draw.
          </p>
        </Card>
      </div>
    </div>
  );
}
