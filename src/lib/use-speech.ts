"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsHydrated } from "@/lib/hooks";

/**
 * Speech input and output for the assistant, built on the browser's Web Speech
 * API.
 *
 * Architecture note: recognition and synthesis run entirely in the browser;
 * only the transcribed text crosses the network, to the same `/api/chat`
 * endpoint the typed assistant uses. That keeps the Gemini key server-side and
 * means voice and text share one grounded knowledge base.
 *
 * Support is uneven — SpeechRecognition is Chrome, Edge and Safari only, and
 * Firefox has neither — so every capability is detected rather than assumed,
 * and the UI hides what is unavailable instead of failing at click time.
 */

/* ------------------------------------------------------------------ *
 * Minimal typings. The Web Speech API is not in TypeScript's DOM lib.
 * ------------------------------------------------------------------ */

type SpeechRecognitionAlternative = { transcript: string; confidence: number };

type SpeechRecognitionResult = {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionErrorEventLike = { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type MicState = "idle" | "listening" | "denied" | "error";

/**
 * Best-sounding English voice the browser offers. Neural voices ("Natural"
 * on Edge, Google's on Chrome, Samantha on Apple) sound far less robotic
 * than the OS default. Returns null to keep the default.
 */
function pickNaturalVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const ranked = [
    (v: SpeechSynthesisVoice) => /natural/i.test(v.name) && /en-(US|GB|IN)/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /natural/i.test(v.name),
    (v: SpeechSynthesisVoice) => /^Google US English/i.test(v.name),
    (v: SpeechSynthesisVoice) => /^Google UK English Female/i.test(v.name),
    (v: SpeechSynthesisVoice) => /Samantha|Ava|Allison/i.test(v.name),
  ];
  for (const test of ranked) {
    const match = voices.find(test);
    if (match) return match;
  }
  return null;
}

export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
};

export function useSpeech({
  onTranscript,
  onWord,
  naturalVoice = false,
  lang = "en-US",
}: {
  /** Called once per finished utterance, with the transcribed text. */
  onTranscript: (text: string) => void;
  /** Called at each word boundary while speaking — drives voice visuals. */
  onWord?: () => void;
  /** Prefer the most natural-sounding English voice available. */
  naturalVoice?: boolean;
  lang?: string;
}) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const speechGeneration = useRef(0);
  // Keeps the latest callback without rebuilding the recognizer each render.
  const onTranscriptRef = useRef(onTranscript);
  const onWordRef = useRef(onWord);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onWordRef.current = onWord;
  }, [onTranscript, onWord]);

  /* ------------------------------------------------------- capability */
  // Derived from hydration rather than set in an effect: browser capabilities
  // are static, and the server must report none so the markup matches.
  const hydrated = useIsHydrated();
  const support = useMemo<SpeechSupport>(
    () =>
      hydrated
        ? {
            recognition: getRecognitionCtor() !== null,
            synthesis: "speechSynthesis" in window,
          }
        : { recognition: false, synthesis: false },
    [hydrated],
  );

  /* ------------------------------------------------------ recognition */
  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const instance = new Ctor();
    instance.lang = lang;
    // One utterance per activation — the assistant answers between turns.
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      setMicState("listening");
      setInterim("");
    };

    instance.onresult = (event) => {
      let finalText = "";
      let pending = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text;
        else pending += text;
      }

      setInterim(pending);

      if (finalText.trim()) {
        setInterim("");
        onTranscriptRef.current(finalText.trim());
      }
    };

    instance.onerror = (event) => {
      // "aborted" and "no-speech" are ordinary outcomes, not failures.
      if (event.error === "aborted" || event.error === "no-speech") {
        setMicState("idle");
        return;
      }
      setMicState(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "denied"
          : "error",
      );
    };

    instance.onend = () => {
      setInterim("");
      setMicState((s) => (s === "listening" ? "idle" : s));
    };

    recognition.current = instance;

    return () => {
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
      instance.onstart = null;
      try {
        instance.abort();
      } catch {
        /* already stopped */
      }
      recognition.current = null;
    };
  }, [lang]);

  const startListening = useCallback(() => {
    const instance = recognition.current;
    if (!instance) return;
    // Never listen to our own playback.
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
    try {
      instance.start();
    } catch {
      // start() throws if already running — treat as already listening.
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognition.current?.stop();
    } catch {
      /* not running */
    }
    setMicState("idle");
    setInterim("");
  }, []);

  /* ------------------------------------------------------- synthesis */
  // Speech is a queue of sentence-sized utterances. Chrome's network voices
  // silently stop after roughly fifteen seconds of a single utterance, and a
  // queue also lets a streaming answer start speaking at its first sentence.
  // `speaking` is true while anything in the queue is unfinished; the
  // generation counter discards events from a queue that has been cancelled.
  const pending = useRef(0);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    speechGeneration.current++;
    pending.current = 0;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  /** Adds text to the end of the queue without interrupting what is playing. */
  const enqueue = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = cleanForSpeech(text);
      if (!clean) return;

      const generation = speechGeneration.current;
      const current = () => generation === speechGeneration.current;
      const voice = naturalVoice ? pickNaturalVoice() : null;

      for (const sentence of splitSentences(clean)) {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = voice?.lang ?? "en-US";
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        const done = () => {
          if (!current()) return;
          pending.current = Math.max(0, pending.current - 1);
          if (pending.current === 0) setSpeaking(false);
        };
        utterance.onstart = () => current() && setSpeaking(true);
        utterance.onend = done;
        utterance.onerror = done;
        utterance.onboundary = (event) => {
          if (event.name === "word") onWordRef.current?.();
        };
        pending.current++;
        window.speechSynthesis.speak(utterance);
      }
    },
    [naturalVoice],
  );

  /** Replaces whatever is playing with `text`. */
  const speak = useCallback(
    (text: string) => {
      stopSpeaking();
      enqueue(text);
    },
    [stopSpeaking, enqueue],
  );

  /** True while queued speech has not finished — read at call time, not render. */
  const isSpeechPending = useCallback(() => pending.current > 0, []);

  // Cancel any queued speech if the component goes away mid-sentence.
  useEffect(
    () => () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  return {
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
  };
}

/** Strips markdown and turns paths into words, so nothing odd is read aloud. */
function cleanForSpeech(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    // Read paths as words rather than slashes.
    .replace(/\/([a-z-]+)(\/[a-z-]+)?/g, (_m, a, b) =>
      b ? `${a} ${String(b).slice(1)} page` : `${a} page`,
    )
    .trim();
}

function splitSentences(text: string) {
  return text.match(/[^.!?\n]+[.!?]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/**
 * Speaks a streaming answer as it arrives: each time `feed` is called with
 * the text so far, every newly completed sentence is queued; `flush` queues
 * whatever is left at the end. The first sentence starts playing while the
 * rest is still being generated, which is most of what makes a voice agent
 * feel responsive.
 */
export function createSentenceFeeder(enqueue: (text: string) => void) {
  let spoken = 0;
  return {
    feed(full: string) {
      const rest = full.slice(spoken);
      // A sentence is complete once its punctuation is followed by
      // whitespace, so "Next.js" and "2.5" are never split.
      const boundary = /[.!?]["')\]]?\s+|\n+/g;
      let end = -1;
      for (let m = boundary.exec(rest); m; m = boundary.exec(rest)) end = m.index + m[0].length;
      if (end > 0) {
        enqueue(rest.slice(0, end));
        spoken += end;
      }
    },
    flush(full: string) {
      const rest = full.slice(spoken);
      spoken = full.length;
      if (rest.trim()) enqueue(rest);
    },
  };
}
