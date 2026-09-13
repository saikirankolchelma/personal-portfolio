"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import type { Question, Quiz as QuizData } from "@/content/quizzes";
import { useStoredNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Shuffles a copy, so question order differs between attempts. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function Quiz({ quiz }: { quiz: QuizData }) {
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const [best, setBest] = useStoredNumber(`quiz:best:${quiz.slug}`, 0);

  // Re-shuffled whenever `round` changes, which is how restart works.
  const questions = useMemo<Question[]>(
    () => shuffled(quiz.questions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz.questions, round],
  );

  const current = questions[index]!;
  const answered = picked !== null;
  const isCorrect = picked === current.answer;

  function choose(option: number) {
    if (answered) return;
    setPicked(option);
    if (option === current.answer) setScore((s) => s + 1);
  }

  function next() {
    const finalScore = score;
    if (index + 1 >= questions.length) {
      setDone(true);
      if (finalScore > best) setBest(finalScore);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function restart() {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">
          Result
        </p>
        <p className="mt-4 text-5xl font-semibold text-accent">
          {score}
          <span className="text-2xl text-fg-subtle">/{questions.length}</span>
        </p>
        <p className="mt-3 text-sm text-fg-muted">
          {pct >= 90
            ? "Excellent — you know this material."
            : pct >= 70
              ? "Solid. A few worth revisiting."
              : pct >= 50
                ? "A reasonable base. The explanations are where the value is."
                : "Worth another pass — read the explanations as you go."}
        </p>
        {best > 0 ? (
          <p className="mt-4 text-xs text-fg-subtle">
            Best so far: {best}/{questions.length}
          </p>
        ) : null}
        <Button className="mt-8" onClick={restart}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* progress */}
      <div className="mb-5 flex items-center justify-between gap-4 text-sm">
        <p className="text-fg-subtle">
          Question <span className="font-mono text-fg">{index + 1}</span> of{" "}
          <span className="font-mono">{questions.length}</span>
        </p>
        <p className="text-fg-subtle">
          Score <span className="font-mono text-accent">{score}</span>
        </p>
      </div>

      <div
        className="mb-7 h-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold leading-snug">{current.question}</h2>

        <div className="mt-6 space-y-2.5">
          {current.options.map((option, i) => {
            const isAnswer = i === current.answer;
            const isPicked = i === picked;

            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  !answered && "border-border hover:border-accent/40 hover:bg-accent-soft",
                  answered && isAnswer && "border-success/40 bg-success/10 text-success",
                  answered &&
                    isPicked &&
                    !isAnswer &&
                    "border-danger/40 bg-danger/10 text-danger",
                  answered && !isAnswer && !isPicked && "border-border opacity-50",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {answered && isAnswer ? (
                    <Check className="h-4 w-4" />
                  ) : answered && isPicked ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-border-strong font-mono text-[0.6rem] text-fg-subtle">
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div
            className={cn(
              "mt-6 rounded-xl border p-4",
              isCorrect
                ? "border-success/30 bg-success/10"
                : "border-border bg-surface-2",
            )}
          >
            <p
              className={cn(
                "text-sm font-medium",
                isCorrect ? "text-success" : "text-fg",
              )}
            >
              {isCorrect ? "Correct" : "Not quite"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {current.explanation}
            </p>
          </div>
        ) : null}

        {answered ? (
          <Button className="mt-6 w-full" onClick={next}>
            {index + 1 >= questions.length ? "See result" : "Next question"}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
