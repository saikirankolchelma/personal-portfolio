"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RotateCcw, Search, Sparkles } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui/primitives";
import {
  bm25,
  chunkText,
  SAMPLE_QUERIES,
  SAMPLE_TEXT,
  SPREAD_THRESHOLD,
  tokenize,
} from "@/lib/bm25";
import { cn } from "@/lib/utils";

/**
 * An interactive retrieval demo.
 *
 * Everything here is real: actual chunking with overlap, actual Okapi BM25
 * scoring, running on whatever text the visitor pastes in. Nothing is
 * simulated, and no request leaves the browser.
 *
 * The point it is built to make is the comparative-question failure — ask
 * "which of these is safest" and retrieval returns chunks about each drug
 * separately, because the comparison exists between records rather than
 * inside any one of them. That is the limit a knowledge graph addresses.
 */

const TOP_K = 3;

export function RagPlayground() {
  const [text, setText] = useState(SAMPLE_TEXT);
  // Explicit <string>: SAMPLE_QUERIES is `as const`, so inference would
  // otherwise pin the state to that one literal and reject every other query.
  const [query, setQuery] = useState<string>(SAMPLE_QUERIES[0].q);
  const [size, setSize] = useState(220);
  const [overlap, setOverlap] = useState(40);

  const chunks = useMemo(() => chunkText(text, { size, overlap }), [text, size, overlap]);
  const scored = useMemo(() => bm25(chunks, query), [chunks, query]);
  const queryTerms = useMemo(() => new Set(tokenize(query)), [query]);

  const retrieved = scored.filter((c) => c.score > 0).slice(0, TOP_K);
  const topScore = retrieved[0]?.score ?? 0;

  /**
   * When the runner-up scores nearly as high as the top hit, retrieval has
   * found several partial matches rather than one answer — the signature of a
   * question whose answer lives between chunks instead of inside one.
   */
  const isSpread =
    retrieved.length >= 2 &&
    topScore > 0 &&
    (retrieved[1]?.score ?? 0) / topScore > SPREAD_THRESHOLD;

  /** Highlights query terms inside a chunk so the match is visible. */
  function highlight(chunkText: string) {
    return chunkText.split(/(\s+)/).map((word, i) => {
      const bare = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      return queryTerms.has(bare) ? (
        <mark
          key={i}
          className="rounded bg-accent/25 px-0.5 text-fg [color-scheme:normal]"
        >
          {word}
        </mark>
      ) : (
        <span key={i}>{word}</span>
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------ controls */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">1 · Your corpus</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText(SAMPLE_TEXT);
              setQuery(SAMPLE_QUERIES[0].q);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          aria-label="Source text to index"
          placeholder="Paste any text — documentation, notes, a contract…"
          className="w-full resize-y rounded-lg border border-border bg-surface-2 p-4 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-baseline justify-between text-xs text-fg-muted">
              Chunk size
              <span className="font-mono text-fg-subtle">{size} chars</span>
            </span>
            <input
              type="range"
              min={80}
              max={600}
              step={20}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-baseline justify-between text-xs text-fg-muted">
              Overlap
              <span className="font-mono text-fg-subtle">{overlap} chars</span>
            </span>
            <input
              type="range"
              min={0}
              max={160}
              step={10}
              value={overlap}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-fg-subtle">
          Split into <span className="font-mono text-accent">{chunks.length}</span>{" "}
          chunks. Overlap keeps a sentence split across a boundary from losing
          the context that made it meaningful.
        </p>
      </Card>

      {/* --------------------------------------------------------- query */}
      <Card className="p-5 sm:p-6">
        <p className="mb-4 text-sm font-medium">2 · Ask it something</p>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Query"
            placeholder="What do you want to know?"
            className="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((s) => (
            <button
              key={s.q}
              type="button"
              onClick={() => setQuery(s.q)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                query === s.q
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border text-fg-muted hover:text-fg",
              )}
            >
              {s.kind === "lookup" ? "✅ " : "⚠ "}
              {s.q}
            </button>
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------------- results */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">
            3 · What gets sent to the model
          </p>
          <Badge tone="outline">top {TOP_K} by BM25</Badge>
        </div>

        {retrieved.length === 0 ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
            <p className="text-sm font-medium text-warning">
              Nothing matched — and the answer is right there
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              The corpus says <em>gastrointestinal irritation</em>; you asked
              about the <em>stomach</em>. Same meaning, no shared words, so a
              lexical scorer returns zero. This is the gap dense embeddings
              exist to close, and why production retrieval runs both and
              combines them — hybrid search.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {retrieved.map((chunk, rank) => (
              <div
                key={chunk.id}
                className="rounded-xl border border-border bg-surface-2 p-4"
              >
                <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Badge tone={rank === 0 ? "accent" : "default"}>
                    #{rank + 1}
                  </Badge>
                  <span className="font-mono text-xs text-fg-subtle">
                    chunk {chunk.id} · score{" "}
                    <span className="text-accent">{chunk.score.toFixed(3)}</span>
                  </span>
                  <span className="ml-auto flex flex-wrap gap-1">
                    {chunk.matched.slice(0, 4).map((m) => (
                      <span
                        key={m.term}
                        title={`contributed ${m.contribution.toFixed(3)}`}
                        className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-fg-subtle"
                      >
                        {m.term} +{m.contribution.toFixed(2)}
                      </span>
                    ))}
                  </span>
                </div>

                {/* Score bar, relative to the top hit. */}
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(chunk.score / topScore) * 100}%` }}
                  />
                </div>

                <p className="text-sm leading-relaxed text-fg-muted">
                  {highlight(chunk.text)}
                </p>
              </div>
            ))}
          </div>
        )}

        {isSpread ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-warning">
                Notice the scores are close
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                Retrieval found several partial matches rather than one answer.
                That is what a comparative question looks like: the answer is
                not inside any single chunk, it is in the relationship{" "}
                <em>between</em> them. No amount of chunk tuning fixes it —
                which is the point at which modelling the domain as a graph
                stops being overhead and starts being the only honest option.
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-fg-subtle">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Real Okapi BM25 with the standard k₁=1.5, b=0.75, running entirely in
        your browser. Term frequency saturates, rare terms count for more, and
        long chunks are penalised so they cannot win on length alone. Nothing
        is sent anywhere.
      </p>
    </div>
  );
}
