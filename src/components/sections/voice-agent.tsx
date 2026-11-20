"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Mic, MicOff, Square } from "lucide-react";

import { createSentenceFeeder, useSpeech } from "@/lib/use-speech";
import { useMicLevel } from "@/lib/use-mic-level";
import { plainText, streamChat, type ChatTurn } from "@/lib/chat-client";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/components/sections/voice-orb";

/**
 * A voice agent you can talk to, embodied as a 3D orb.
 *
 * Speech recognition and synthesis run in the browser (see use-speech.ts);
 * only the transcript crosses the network, to the same grounded /api/chat
 * endpoint the chat assistant uses. The orb reacts to the real microphone
 * level while listening and to word boundaries while speaking.
 *
 * Browsers without speech recognition still get the full loop through the
 * suggested questions — the answer is still spoken and the orb still moves.
 */

const VoiceOrb = dynamic(
  () => import("@/components/sections/voice-orb").then((m) => m.VoiceOrb),
  { ssr: false, loading: () => null },
);

const SUGGESTIONS = [
  "What do you build?",
  "Tell me about the agentic platform",
  "Are you open to freelance work?",
] as const;

const STATUS: Record<VoiceState, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking",
};

export function VoiceAgent() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levelRef = useRef(0);
  const stateRef = useRef<VoiceState>("idle");
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const askRef = useRef<(text: string) => void>(() => {});

  const {
    support,
    micState,
    interim,
    speaking,
    startListening,
    stopListening,
    speak,
    enqueue,
    stopSpeaking,
  } = useSpeech({
      onTranscript: useCallback((text: string) => askRef.current(text), []),
      onWord: useCallback(() => {
        levelRef.current = 0.75 + Math.random() * 0.25;
      }, []),
      naturalVoice: true,
    });

  const listening = micState === "listening";
  const state: VoiceState = listening ? "listening" : thinking ? "thinking" : speaking ? "speaking" : "idle";

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useMicLevel(listening, levelRef);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      stopSpeaking();
      setQuestion(text);
      setAnswer("");
      setError(null);
      setThinking(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Each sentence is spoken as soon as it is complete, so the answer
      // starts out loud while the rest is still being generated.
      const feeder = createSentenceFeeder(enqueue);
      try {
        const full = await streamChat({
          message: text,
          history: turns,
          voice: true,
          signal: controller.signal,
          onText: (t) => {
            setThinking(false);
            setAnswer(t);
            feeder.feed(t);
          },
        });
        setTurns((t) => [...t, { role: "user", content: text }, { role: "model", content: full }]);
        setThinking(false);
        feeder.flush(full);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setThinking(false);
        speak(message);
      } finally {
        setThinking(false);
        busyRef.current = false;
        abortRef.current = null;
      }
    },
    [turns, speak, enqueue, stopSpeaking],
  );

  useEffect(() => {
    askRef.current = (text: string) => void ask(text);
  }, [ask]);

  const toggleMic = () => {
    if (listening) stopListening();
    else {
      stopSpeaking();
      startListening();
    }
  };

  const caption = listening
    ? interim || "Go ahead — ask about my work, projects or availability."
    : error ?? (answer ? plainText(answer) : "");

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      {/* --------------------------------------------------------- orb */}
      <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[12%] rounded-full opacity-80 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--glow), transparent 75%)" }}
        />
        <VoiceOrb stateRef={stateRef} levelRef={levelRef} />
        <button
          type="button"
          onClick={support.recognition ? toggleMic : undefined}
          disabled={!support.recognition}
          aria-label={listening ? "Stop listening" : "Talk to the voice agent"}
          className="absolute inset-[24%] rounded-full focus-visible:outline-offset-8 enabled:cursor-pointer disabled:cursor-default"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] backdrop-blur",
              state === "idle"
                ? "border-border bg-surface/70 text-fg-subtle"
                : "border-accent-2/40 bg-surface/80 text-accent-2",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "idle" ? "bg-fg-subtle" : "bg-accent-2 animate-pulse",
              )}
            />
            {STATUS[state]}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- controls */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          {support.recognition ? (
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                "inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-sm font-medium transition-all",
                listening
                  ? "bg-accent-2 text-bg shadow-[0_0_32px_-4px_var(--accent-2)]"
                  : "bg-accent text-accent-fg shadow-[0_4px_24px_-6px_var(--glow)] hover:brightness-110",
              )}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop listening" : "Tap to talk"}
            </button>
          ) : null}
          {speaking ? (
            <button
              type="button"
              onClick={stopSpeaking}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-surface px-5 text-sm text-fg hover:bg-surface-2"
            >
              <Square className="h-3.5 w-3.5" />
              Stop speaking
            </button>
          ) : null}
        </div>

        {micState === "denied" ? (
          <p className="mt-3 text-xs text-warning">
            Microphone access is blocked — allow it in the address bar, or use a
            question below.
          </p>
        ) : null}
        {!support.recognition && support.synthesis ? (
          <p className="mt-3 text-xs text-fg-subtle">
            This browser cannot listen, but the agent can still answer out loud —
            pick a question below.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void ask(s)}
              disabled={thinking}
              className="rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent/50 hover:text-fg disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Live transcript. */}
        <div
          className="mt-6 min-h-[9.5rem] rounded-[var(--radius-card)] border border-border bg-surface/70 p-5 backdrop-blur"
          aria-live="polite"
        >
          {question && !listening ? (
            <p className="mb-3 text-xs text-fg-subtle">
              <span className="font-mono uppercase tracking-[0.14em] text-accent">You</span>
              <span className="ml-2">{question}</span>
            </p>
          ) : null}
          {caption ? (
            <p
              className={cn(
                "max-h-48 overflow-y-auto whitespace-pre-line text-sm leading-relaxed",
                error ? "text-warning" : "text-fg",
              )}
            >
              {caption}
            </p>
          ) : thinking ? (
            <p className="text-sm text-fg-subtle">Thinking…</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-fg-subtle">
              <AudioLines className="h-4 w-4 text-accent" aria-hidden />
              Answers appear here as they are spoken.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
