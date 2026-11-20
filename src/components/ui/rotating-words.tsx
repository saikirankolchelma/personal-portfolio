"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Cycles through a list of phrases, each one rising into place.
 *
 * Screen readers get the whole list once instead of a live region that would
 * announce a new phrase every few seconds. Reduced motion holds the first
 * phrase.
 */
export function RotatingWords({
  words,
  interval = 2600,
  className,
}: {
  words: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [reduced, words.length, interval]);

  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      <span key={index} aria-hidden className="word-in inline-block">
        {words[index]}
      </span>
    </span>
  );
}
