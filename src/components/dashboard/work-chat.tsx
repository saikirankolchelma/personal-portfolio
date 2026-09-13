"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, RefreshCw } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "model"; content: string };

const SUGGESTIONS = [
  "What did I work on this week?",
  "What's still open or blocked?",
  "Summarize my RAG-related work",
  "What did I learn about agents recently?",
  "Generate a weekly work summary",
];

/** Minimal markdown rendering — paragraphs, bullets, bold, inline code. */
function Answer({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));

        if (isList) {
          return (
            <ul key={i} className="my-2 space-y-1.5 first:mt-0 last:mb-0">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                  />
                  <span>{inline(line.replace(/^\s*[-*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="my-2 first:mt-0 last:mb-0">
            {inline(block)}
          </p>
        );
      })}
    </>
  );
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function WorkChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || streaming) return;

      setError(null);
      setInput("");

      const history = turns.slice(-12);
      setTurns((t) => [
        ...t,
        { role: "user", content: text },
        { role: "model", content: "" },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/dashboard/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => ({}));
          setTurns((t) => t.slice(0, -1));
          setError(body.error ?? "Something went wrong. Please try again.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setTurns((t) => [...t.slice(0, -1), { role: "model", content: answer }]);
        }

        if (!answer.trim()) {
          setTurns((t) => t.slice(0, -1));
          setError("No response came back. Please try again.");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setTurns((t) => t.slice(0, -1));
        setError("Could not reach the assistant.");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, turns],
  );

  return (
    <Card className="flex h-[calc(100vh-14rem)] min-h-[26rem] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6">
        {turns.length === 0 ? (
          <div className="mx-auto max-w-lg py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
              <Bot className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-base font-semibold">Ask your work history</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              This assistant reads your logged tasks — the last 45 days plus
              anything matching your question. It answers only from what you have
              actually recorded.
            </p>
            <div className="mt-7 flex flex-col gap-2 text-left">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-xl border border-border bg-surface-2/60 px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {turns.map((turn, i) =>
              turn.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-fg">
                    {turn.content}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-soft text-accent">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm leading-relaxed text-fg-muted">
                    {turn.content ? (
                      <Answer text={turn.content} />
                    ) : (
                      <span className="flex items-center gap-2 py-1 text-fg-subtle">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Reading your tasks…
                      </span>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 focus-within:border-accent">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Ask about your work…"
            aria-label="Your question"
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {turns.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setTurns([]);
                setError(null);
                setStreaming(false);
              }}
              aria-label="Start over"
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                "text-fg-subtle transition-colors hover:bg-surface hover:text-fg",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || streaming}
            aria-label="Send"
            className="h-8 w-8 shrink-0 !px-0"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
