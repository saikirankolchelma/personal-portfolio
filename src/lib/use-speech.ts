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

export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
};

export function useSpeech({
  onTranscript,
  lang = "en-US",
}: {
  /** Called once per finished utterance, with the transcribed text. */
  onTranscript: (text: string) => void;
  lang?: string;
}) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  // Keeps the latest callback without rebuilding the recognizer each render.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

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
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const clean = text
      // Strip the markdown the assistant may emit so it is not read aloud.
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "")
      // Read paths as words rather than slashes.
      .replace(/\/([a-z-]+)(\/[a-z-]+)?/g, (_m, a, b) =>
        b ? `${a} ${String(b).slice(1)} page` : `${a} page`,
      )
      .trim();

    if (!clean) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

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
    stopSpeaking,
  };
}
