"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button, Card } from "@/components/ui/primitives";

/**
 * Text statistics.
 *
 * Reading time uses 230 wpm (typical adult silent reading) and speaking time
 * 140 wpm — stated in the UI, because an unexplained "3 min" is not useful.
 */
const READING_WPM = 230;
const SPEAKING_WPM = 140;

function analyse(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const sentences = trimmed
    ? trimmed.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0)
    : [];
  const paragraphs = trimmed
    ? trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0)
    : [];

  const frequencies = new Map<string, number>();
  for (const word of words) {
    const key = word.toLowerCase().replace(/[^a-z0-9'-]/g, "");
    if (key.length > 3) frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
  }

  const top = [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingMinutes: Math.max(words.length > 0 ? 1 : 0, Math.round(words.length / READING_WPM)),
    speakingMinutes: Math.max(words.length > 0 ? 1 : 0, Math.round(words.length / SPEAKING_WPM)),
    avgWordsPerSentence:
      sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    top,
  };
}

export function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyse(text), [text]);

  const tiles = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Without spaces", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Avg words/sentence", value: stats.avgWordsPerSentence },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-8">
      <Card className="flex flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Your text</p>
          {text ? (
            <Button variant="ghost" size="sm" onClick={() => setText("")}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type anything — a cover letter, a README, a commit message you are second-guessing…"
          aria-label="Text to analyse"
          className="min-h-[22rem] w-full flex-1 resize-y rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />

        <p className="mt-3 text-xs text-fg-subtle">
          Everything is computed in your browser. Nothing is uploaded or stored.
        </p>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            {tiles.map((tile) => (
              <div key={tile.label}>
                <dd className="font-mono text-xl font-semibold text-accent tabular-nums">
                  {tile.value}
                </dd>
                <dt className="mt-0.5 text-xs leading-snug text-fg-subtle">
                  {tile.label}
                </dt>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            Time
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-fg-muted">Reading</span>
              <span className="font-mono tabular-nums">
                {stats.readingMinutes} min
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-fg-muted">Speaking</span>
              <span className="font-mono tabular-nums">
                {stats.speakingMinutes} min
              </span>
            </p>
          </div>
          <p className="mt-3 text-[0.7rem] leading-relaxed text-fg-subtle">
            At {READING_WPM} words per minute reading and {SPEAKING_WPM} speaking.
          </p>
        </Card>

        {stats.top.length > 0 ? (
          <Card className="p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              Most used
            </p>
            <ul className="space-y-1.5">
              {stats.top.map(([word, count]) => (
                <li key={word} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-fg-muted">{word}</span>
                  <span className="font-mono text-xs text-fg-subtle">{count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.7rem] text-fg-subtle">
              Words longer than three characters only.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
