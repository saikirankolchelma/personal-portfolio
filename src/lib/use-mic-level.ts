"use client";

import { useEffect, type RefObject } from "react";

/**
 * Writes the microphone's loudness (0–1) into `levelRef` every frame while
 * `active`, for visuals that follow the speaker's voice.
 *
 * Purely cosmetic: if the stream cannot be opened, speech recognition still
 * works and the level simply stays at zero.
 */
export function useMicLevel(active: boolean, levelRef: RefObject<number>) {
  useEffect(() => {
    if (!active || !navigator.mediaDevices?.getUserMedia) return;
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(s).connect(analyser);
        const buffer = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(buffer);
          let sum = 0;
          for (const v of buffer) {
            const x = (v - 128) / 128;
            sum += x * x;
          }
          levelRef.current = Math.min(1, Math.sqrt(sum / buffer.length) * 5);
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void context?.close();
      levelRef.current = 0;
    };
  }, [active, levelRef]);
}
