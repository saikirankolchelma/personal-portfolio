"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { Mic, MicOff, Minus, SendHorizontal, Volume2, VolumeX, X } from "lucide-react";

import { createSentenceFeeder, useSpeech } from "@/lib/use-speech";
import { useMicLevel } from "@/lib/use-mic-level";
import { plainText, streamChat, type ChatTurn } from "@/lib/chat-client";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/components/sections/voice-orb";

/**
 * Sai's voice agent: the host that greets every visitor.
 *
 * A moment after anyone lands on any page, it introduces Sai and asks what
 * brought them here. Answers come from the same grounded /api/chat endpoint
 * as the other assistants, with the `host` persona — warmer, calls him "Sai",
 * keeps replies short enough to speak, and always asks something back.
 *
 * Browsers will not play speech before the visitor has interacted with the
 * page, so the greeting appears as text immediately and is spoken at the
 * first click or key press (or straight away if they already have). The
 * microphone is never opened without an explicit tap on "Talk to me"; after
 * that the conversation is hands-free — it listens again each time it
 * finishes speaking.
 *
 * Shown once per session. Minimising keeps it a tap away; closing retires it.
 */

const VoiceOrb = dynamic(
  () => import("@/components/sections/voice-orb").then((m) => m.VoiceOrb),
  { ssr: false, loading: () => null },
);

/** Read by AgentOrb, so the chat launcher does not also pop an invitation. */
export const GREETER_SEEN_KEY = "sai-greeter:seen";
const DISMISSED_KEY = "sai-greeter:dismissed";
const OPEN_DELAY_MS = 1800;

const VISITED_KEY = "sai-greeter:visited";

/**
 * The opening line, written to be spoken: time of day for a first visit, a
 * welcome back for a returning one. Every fact in it is in the profile.
 */
function buildGreeting(returning: boolean, hour: number) {
  if (returning) {
    return "Hey, welcome back! Good to see you again. Is there anything you'd like to know about Sai today?";
  }
  const hello =
    hour < 5 ? "Hey there" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${hello}, and welcome! I'm Sai's AI agent. Sai's an AI and machine learning engineer, and he's built over a hundred specialised agents for enterprise clients, along with Graph RAG and MCP tooling. So, what brings you here today? And what would you like to know about Sai?`;
}

function readLocal(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked — every visit is a first visit */
  }
}

/** Quick replies, phrased the way a visitor would say them. */
const QUICK_REPLIES = [
  { label: "I'm hiring", message: "I'm hiring. Why should I consider Sai?" },
  { label: "I have a project", message: "I have a project in mind. How can Sai help?" },
  { label: "What has Sai built?", message: "What has Sai built?" },
  { label: "Just exploring", message: "I'm just exploring. Give me the highlights about Sai." },
] as const;

/**
 * Said only if the answer has not started within a beat — a person fills a
 * pause like that; a fast answer needs no filler.
 */
const ACKNOWLEDGEMENTS = [
  "Sure, one moment.",
  "Let me think about that.",
  "Good one. Give me a second.",
  "Mm, let me check.",
] as const;
const ACK_AFTER_MS = 1200;

const STATUS: Record<VoiceState, string> = {
  idle: "Online",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

function readSession(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked — the greeter just may appear again */
  }
}

type View = "hidden" | "open" | "minimized";

export function Greeter() {
  const [view, setView] = useState<View>("hidden");
  const [greeting, setGreeting] = useState("");
  const [typed, setTyped] = useState(0);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  /** Hands-free mode: on after "Talk to me", re-arms the mic after each reply. */
  const [conversation, setConversation] = useState(false);

  const reduced = useReducedMotion();
  const levelRef = useRef(0);
  const stateRef = useRef<VoiceState>("idle");
  const busyRef = useRef(false);
  const greetedRef = useRef(false);
  /** When the spoken greeting started; 0 once it has finished. */
  const greetingAtRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const askRef = useRef<(text: string) => void>(() => {});
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    support,
    micState,
    interim,
    speaking,
    startListening,
    stopListening,
    speak,
    enqueue,
    isSpeechPending,
    stopSpeaking,
  } =
    useSpeech({
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

  /* --------------------------------------------------------- appear */
  useEffect(() => {
    if (readSession(DISMISSED_KEY)) return;
    // Voices load asynchronously in Chrome; asking early warms the list.
    window.speechSynthesis?.getVoices();
    const timer = setTimeout(() => {
      setGreeting(buildGreeting(readLocal(VISITED_KEY) !== null, new Date().getHours()));
      writeLocal(VISITED_KEY, "1");
      setView("open");
      writeSession(GREETER_SEEN_KEY, "1");
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Type the greeting out (all at once under reduced motion).
  const typedCount = reduced ? greeting.length : typed;
  useEffect(() => {
    if (view !== "open" || reduced || typed >= greeting.length) return;
    const timer = setTimeout(() => setTyped((n) => Math.min(greeting.length, n + 2)), 16);
    return () => clearTimeout(timer);
  }, [view, typed, reduced, greeting]);

  /* ----------------------------------------------- speak the greeting */
  const sayGreeting = useCallback(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    greetingAtRef.current = Date.now();
    speak(greeting);
  }, [speak, greeting]);

  useEffect(() => {
    if (view !== "open" || greetedRef.current || muted || !support.synthesis) return;
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    if (activation?.hasBeenActive) {
      sayGreeting();
      return;
    }
    // Speech needs a user gesture; the first one anywhere on the page counts.
    const onFirstGesture = () => sayGreeting();
    window.addEventListener("pointerdown", onFirstGesture, { once: true, capture: true });
    window.addEventListener("keydown", onFirstGesture, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture, { capture: true });
      window.removeEventListener("keydown", onFirstGesture, { capture: true });
    };
  }, [view, muted, support.synthesis, sayGreeting]);

  /* ------------------------------------------------ hands-free loop */
  const wasSpeaking = useRef(false);
  useEffect(() => {
    const finished = wasSpeaking.current && !speaking;
    wasSpeaking.current = speaking;
    if (finished) greetingAtRef.current = 0;
    if (finished && conversation && !muted && support.recognition && !busyRef.current && view === "open") {
      startListening();
    }
  }, [speaking, conversation, muted, support.recognition, view, startListening]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming, interim, typedCount]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ------------------------------------------------------------ ask */
  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      greetedRef.current = true;
      greetingAtRef.current = 0;
      stopSpeaking();
      stopListening();
      setError(null);
      setDraft("");

      // The greeting is part of the conversation, so the model knows it has
      // already asked why the visitor is here.
      const history: ChatTurn[] = turns.length ? turns : [{ role: "model", content: greeting }];
      setTurns([...history, { role: "user", content: text }]);
      setThinking(true);
      setStreaming("");

      // Spoken while it streams: the first sentence plays as soon as it is
      // complete, and a filler covers the gap only if the model is slow.
      const voiced = !muted;
      const feeder = createSentenceFeeder(enqueue);
      let started = false;
      const ackTimer = voiced
        ? setTimeout(() => {
            if (!started) enqueue(ACKNOWLEDGEMENTS[Math.floor(Math.random() * ACKNOWLEDGEMENTS.length)]!);
          }, ACK_AFTER_MS)
        : undefined;

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const answer = await streamChat({
          message: text,
          history,
          persona: "host",
          signal: controller.signal,
          onText: (t) => {
            started = true;
            setThinking(false);
            setStreaming(t);
            if (voiced) feeder.feed(t);
          },
        });
        setTurns((t) => [...t, { role: "model", content: answer }]);
        setStreaming(null);
        if (voiced) feeder.flush(answer);
        // If the speech already drained while the stream was finishing, the
        // hands-free loop saw no transition, so open the mic from here.
        if (voiced && conversation && support.recognition && !isSpeechPending()) {
          busyRef.current = false;
          startListening();
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setStreaming(null);
        setError(message);
        if (!muted) speak(message);
      } finally {
        clearTimeout(ackTimer);
        setThinking(false);
        busyRef.current = false;
        abortRef.current = null;
      }
    },
    [
      turns,
      greeting,
      muted,
      conversation,
      support.recognition,
      speak,
      enqueue,
      isSpeechPending,
      stopSpeaking,
      stopListening,
      startListening,
    ],
  );

  useEffect(() => {
    askRef.current = (text: string) => void ask(text);
  }, [ask]);

  /* -------------------------------------------------------- actions */
  const talk = () => {
    setConversation(true);
    if (listening) {
      stopListening();
      return;
    }
    if (!greetedRef.current && !muted && support.synthesis) {
      // Greet first; the hands-free loop opens the mic when it finishes.
      sayGreeting();
      return;
    }
    // The same click may have just started the greeting (the first gesture
    // on the page speaks it). Let it finish rather than cutting it off —
    // unless speech never actually started.
    const greetingAge = Date.now() - greetingAtRef.current;
    if (greetingAtRef.current && (speaking || greetingAge < 1500)) return;
    stopSpeaking();
    startListening();
  };

  const toggleMute = () => {
    setMuted((m) => {
      if (!m) stopSpeaking();
      return !m;
    });
  };

  const minimize = () => {
    stopSpeaking();
    stopListening();
    setView("minimized");
  };

  const close = () => {
    abortRef.current?.abort();
    stopSpeaking();
    stopListening();
    setConversation(false);
    setView("hidden");
    writeSession(DISMISSED_KEY, "1");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  if (view === "hidden") return null;

  /* ------------------------------------------------------ minimised */
  if (view === "minimized") {
    return (
      <button
        type="button"
        onClick={() => setView("open")}
        className="fixed bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-full border border-border-strong bg-surface/90 py-2 pl-2.5 pr-4 text-sm shadow-xl backdrop-blur animate-rise sm:left-5"
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-[conic-gradient(from_0deg,var(--accent),var(--accent-2),var(--accent))] animate-breathe">
          <Mic className="h-3.5 w-3.5 text-accent-fg" />
        </span>
        Talk to Sai&apos;s AI agent
      </button>
    );
  }

  /* ----------------------------------------------------------- open */
  const shownGreeting = greeting.slice(0, typedCount);
  const started = turns.length > 0;

  return (
    <section
      aria-label="Sai's AI voice agent"
      className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(34rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface/92 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-rise sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[24rem]"
    >
      {/* Spectral hairline along the top edge. */}
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-accent to-accent-2" />

      {/* -------------------------------------------------- header */}
      <header className="flex items-center gap-3 px-4 pb-3 pt-3.5">
        <div className="relative h-14 w-14 shrink-0">
          <div
            aria-hidden
            className="absolute inset-1 rounded-full opacity-80 blur-xl"
            style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
          />
          <VoiceOrb stateRef={stateRef} levelRef={levelRef} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Sai&apos;s AI agent</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-subtle">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "idle" ? "bg-success" : "bg-accent-2 animate-pulse",
              )}
            />
            {STATUS[state]}
          </p>
        </div>
        {support.synthesis ? (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute voice" : "Mute voice"}
            aria-pressed={muted}
            className="rounded-full p-2 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={minimize}
          aria-label="Minimise"
          className="rounded-full p-2 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="-mr-1 rounded-full p-2 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* ------------------------------------------------ messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3" aria-live="polite">
        <Bubble role="model">
          {shownGreeting}
          {typedCount < greeting.length ? <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle" /> : null}
        </Bubble>
        {turns.slice(1).map((turn, i) => (
          <Bubble key={i} role={turn.role}>
            {turn.role === "model" ? plainText(turn.content) : turn.content}
          </Bubble>
        ))}
        {thinking ? (
          <Bubble role="model">
            <span className="inline-flex gap-1" aria-label="Thinking">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </span>
          </Bubble>
        ) : streaming ? (
          <Bubble role="model">{plainText(streaming)}</Bubble>
        ) : null}
        {listening ? (
          <Bubble role="user" pending>
            {interim || "Listening…"}
          </Bubble>
        ) : null}
        {error ? <p className="text-xs text-warning">{error}</p> : null}
      </div>

      {/* ------------------------------------------------ controls */}
      <div className="border-t border-border px-4 pb-4 pt-3">
        {!started && typedCount >= greeting.length ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => void ask(q.message)}
                className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
              >
                {q.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {support.recognition ? (
            <button
              type="button"
              onClick={talk}
              aria-label={listening ? "Stop listening" : "Talk to the agent"}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all",
                listening
                  ? "bg-accent-2 text-bg shadow-[0_0_24px_-4px_var(--accent-2)]"
                  : "bg-accent text-accent-fg hover:brightness-110",
              )}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop" : started ? "Talk" : "Talk to me"}
            </button>
          ) : null}
          <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-bg/60 pl-3.5 pr-1 focus-within:border-accent/60">
            <label htmlFor="greeter-input" className="sr-only">
              Type a message
            </label>
            <input
              id="greeter-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={support.recognition ? "or type…" : "Ask about Sai…"}
              maxLength={500}
              autoComplete="off"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              aria-label="Send"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-accent transition-colors hover:bg-accent-soft disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </div>
        {micState === "denied" ? (
          <p className="mt-2 text-[0.7rem] text-warning">
            Microphone is blocked — allow it in the address bar, or type instead.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Bubble({
  role,
  pending = false,
  children,
}: {
  role: ChatTurn["role"];
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          role === "user"
            ? "rounded-br-md bg-accent text-accent-fg"
            : "rounded-bl-md border border-border bg-surface-2 text-fg",
          pending && "opacity-70",
        )}
      >
        {children}
      </p>
    </div>
  );
}
