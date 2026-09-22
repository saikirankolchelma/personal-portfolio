"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Mic, RefreshCw, Square, Volume2, VolumeX, X } from "lucide-react";

import { Button } from "@/components/ui/primitives";
import { AgentOrb } from "@/components/chat/agent-orb";
import {
  assistantDisclaimer,
  assistantIntro,
  suggestedQuestions,
} from "@/content/assistant";
import { profile } from "@/content/profile";
import { useSpeech } from "@/lib/use-speech";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "model"; content: string };

/** Renders the small subset of markdown the assistant is told to use. */
function AnswerText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));

        if (isList) {
          return (
            <ul key={i} className="my-2 space-y-1.5 first:mt-0 last:mb-0">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
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

/** Bold and inline code only — the assistant is instructed not to use more. */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** When on, answers are read aloud and the mic re-arms after each reply. */
  const [voiceMode, setVoiceMode] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** `send` is defined below; the mic callback reaches it through this ref. */
  const sendRef = useRef<(text: string) => void>(() => {});

  const {
    support,
    micState,
    interim,
    speaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech({
    // Stable identity: it only forwards to the ref, so the recognizer is not
    // torn down and rebuilt on every render.
    onTranscript: useCallback((text: string) => sendRef.current(text), []),
  });

  // Keep the newest message in view as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Abandon an in-flight request if the widget unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || streaming) return;

      setError(null);
      setInput("");

      // Snapshot the history before appending, so the request carries the
      // conversation as it stood when the question was asked.
      const history = turns.slice();
      setTurns([...history, { role: "user", content: text }, { role: "model", content: "" }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => ({}));
          setError(
            body.error ??
              `Something went wrong. You can email Sai Kiran at ${profile.email}.`,
          );
          // Drop the empty placeholder turn.
          setTurns((t) => t.slice(0, -1));
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
          setError("I did not get a response back. Please try again.");
        } else if (voiceMode) {
          // Spoken only once the full answer has arrived — reading partial
          // chunks aloud produces stuttering, clipped speech.
          speak(answer);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setTurns((t) => t.slice(0, -1));
        setError(
          `Could not reach the assistant. You can email Sai Kiran at ${profile.email}.`,
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, turns, voiceMode, speak],
  );

  // Voice transcripts are delivered by a callback created before `send`
  // exists, so the latest `send` is published to the ref after each render.
  useEffect(() => {
    sendRef.current = (text: string) => void send(text);
  }, [send]);

  function toggleMic() {
    if (micState === "listening") {
      stopListening();
      return;
    }
    stopSpeaking();
    if (!voiceMode) setVoiceMode(true);
    startListening();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    stopSpeaking();
    stopListening();
    setTurns([]);
    setError(null);
    setStreaming(false);
    inputRef.current?.focus();
  }

  return (
    <>
      <AgentOrb open={open} onToggle={() => setOpen((v) => !v)} />

      {/* --------------------------------------------------------- panel */}
      <div
        id="assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-label="AI assistant"
        hidden={!open}
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden border border-border bg-surface shadow-2xl",
          // Full-height sheet on phones, floating panel from sm upward.
          "inset-x-0 bottom-0 top-0 rounded-none",
          "sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(36rem,calc(100vh-3rem))] sm:w-[24rem] sm:rounded-2xl",
        )}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-soft text-accent">
              <Bot className="h-[1.05rem] w-[1.05rem]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profile.shortName}&apos;s AI assistant
              </p>
              <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                Ask about his work
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {support.synthesis ? (
              <button
                type="button"
                onClick={() => {
                  if (voiceMode) stopSpeaking();
                  setVoiceMode((v) => !v);
                }}
                aria-pressed={voiceMode}
                aria-label={
                  voiceMode ? "Turn off spoken answers" : "Turn on spoken answers"
                }
                title={voiceMode ? "Spoken answers on" : "Spoken answers off"}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition-colors",
                  voiceMode
                    ? "bg-accent-soft text-accent"
                    : "text-fg-subtle hover:bg-surface-2 hover:text-fg",
                )}
              >
                {voiceMode ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </button>
            ) : null}
            {turns.length > 0 ? (
              <button
                type="button"
                onClick={reset}
                aria-label="Start a new conversation"
                className="grid h-8 w-8 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid h-8 w-8 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {turns.length === 0 ? (
            <div>
              <p className="text-sm leading-relaxed text-fg-muted">
                {assistantIntro}
              </p>
              <p className="mb-2.5 mt-6 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-subtle">
                Try asking
              </p>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void send(question)}
                    className="rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-left text-sm text-fg-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm text-accent-fg">
                      {turn.content}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-soft text-accent">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm leading-relaxed text-fg-muted">
                      {turn.content ? (
                        <AnswerText text={turn.content} />
                      ) : (
                        <span className="inline-flex gap-1 py-1.5" aria-label="Thinking">
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle"
                              style={{ animationDelay: `${d * 0.15}s` }}
                            />
                          ))}
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
              className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
        </div>

        {/* composer */}
        <form onSubmit={onSubmit} className="border-t border-border p-3">
          {micState === "listening" || speaking || micState === "denied" || micState === "error" ? (
            <div
              aria-live="polite"
              className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs"
            >
              {micState === "listening" ? (
                <>
                  <span className="flex min-w-0 items-center gap-2 text-accent">
                    <span className="relative grid h-3 w-3 shrink-0 place-items-center">
                      <span className="absolute h-2 w-2 rounded-full bg-accent animate-pulse-ring" />
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <span className="truncate">
                      {interim || "Listening…"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="shrink-0 text-fg-subtle hover:text-fg"
                  >
                    Stop
                  </button>
                </>
              ) : speaking ? (
                <>
                  <span className="flex items-center gap-2 text-fg-muted">
                    <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Speaking…
                  </span>
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="flex shrink-0 items-center gap-1 text-fg-subtle hover:text-fg"
                  >
                    <Square className="h-3 w-3" aria-hidden />
                    Stop
                  </button>
                </>
              ) : (
                <span className="text-danger">
                  {micState === "denied"
                    ? "Microphone access was blocked. Enable it in your browser settings, or type instead."
                    : "The microphone stopped unexpectedly. You can type instead."}
                </span>
              )}
            </div>
          ) : null}

          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 focus-within:border-accent">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={1000}
              placeholder="Ask about his experience…"
              aria-label="Your question"
              className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            {support.recognition ? (
              <button
                type="button"
                onClick={toggleMic}
                disabled={streaming}
                aria-pressed={micState === "listening"}
                aria-label={
                  micState === "listening" ? "Stop listening" : "Ask by voice"
                }
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40",
                  micState === "listening"
                    ? "bg-accent-soft text-accent"
                    : "text-fg-subtle hover:bg-surface hover:text-fg",
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
            ) : null}
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || streaming}
              aria-label="Send question"
              className="h-8 w-8 shrink-0 !px-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 px-1 text-[0.7rem] leading-relaxed text-fg-subtle">
            {assistantDisclaimer}
            {support.recognition ? " Tap the mic to ask out loud." : null}
          </p>
        </form>
      </div>
    </>
  );
}
