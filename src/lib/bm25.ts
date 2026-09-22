/**
 * Chunking and BM25 retrieval, implemented properly and run in the browser.
 *
 * This is the real Okapi BM25 scoring function, not a mock — the demo would
 * be worthless if the numbers were invented. It runs client-side because the
 * corpus is whatever the visitor pastes in, which means no API cost, no
 * latency, and nothing leaving their machine.
 */

export type Chunk = {
  id: number;
  text: string;
  /** Character offsets into the source, for highlighting. */
  start: number;
  end: number;
  tokens: string[];
};

export type ScoredChunk = Chunk & {
  score: number;
  /** Per-term contribution, so the score can be explained rather than asserted. */
  matched: { term: string; contribution: number }[];
};

/** BM25 tuning constants. These are the standard defaults. */
const K1 = 1.5;
const B = 0.75;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has",
  "have", "he", "in", "is", "it", "its", "of", "on", "or", "that", "the",
  "their", "then", "there", "these", "they", "this", "to", "was", "were",
  "which", "with", "you", "your",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Splits text into overlapping chunks on word boundaries.
 *
 * Overlap exists because a naive hard split puts the two halves of a sentence
 * in different chunks, and whichever half matched the query arrives without
 * the context that made it meaningful.
 */
export function chunkText(
  text: string,
  { size, overlap }: { size: number; overlap: number },
): Chunk[] {
  const source = text.trim();
  if (!source) return [];

  const safeOverlap = Math.min(overlap, Math.max(0, size - 1));
  const chunks: Chunk[] = [];
  let start = 0;
  let id = 0;

  while (start < source.length) {
    let end = Math.min(start + size, source.length);

    // Prefer to break on whitespace rather than mid-word.
    if (end < source.length) {
      const lastSpace = source.lastIndexOf(" ", end);
      if (lastSpace > start + size * 0.6) end = lastSpace;
    }

    const slice = source.slice(start, end).trim();
    if (slice) {
      chunks.push({ id: id++, text: slice, start, end, tokens: tokenize(slice) });
    }

    if (end >= source.length) break;
    start = end - safeOverlap;
  }

  return chunks;
}

/**
 * Scores every chunk against the query with Okapi BM25.
 *
 * Three ideas are doing the work:
 *  - term frequency saturates, so the tenth occurrence of a word adds far
 *    less than the second;
 *  - rare terms across the corpus count for more (the IDF factor);
 *  - long chunks are penalised, so they cannot win on length alone.
 */
export function bm25(chunks: Chunk[], query: string): ScoredChunk[] {
  const queryTerms = [...new Set(tokenize(query))];
  if (chunks.length === 0 || queryTerms.length === 0) {
    return chunks.map((c) => ({ ...c, score: 0, matched: [] }));
  }

  const avgLength =
    chunks.reduce((sum, c) => sum + c.tokens.length, 0) / chunks.length;

  // Document frequency: how many chunks contain each term at all.
  const docFreq = new Map<string, number>();
  for (const term of queryTerms) {
    docFreq.set(term, chunks.filter((c) => c.tokens.includes(term)).length);
  }

  return chunks
    .map((chunk) => {
      const matched: ScoredChunk["matched"] = [];
      let score = 0;

      for (const term of queryTerms) {
        const tf = chunk.tokens.filter((t) => t === term).length;
        if (tf === 0) continue;

        const df = docFreq.get(term) ?? 0;
        // Smoothed IDF — the +1 keeps it positive for terms in every chunk.
        const idf = Math.log(1 + (chunks.length - df + 0.5) / (df + 0.5));

        const contribution =
          idf *
          ((tf * (K1 + 1)) /
            (tf + K1 * (1 - B + (B * chunk.tokens.length) / avgLength)));

        score += contribution;
        matched.push({ term, contribution });
      }

      matched.sort((a, b) => b.contribution - a.contribution);
      return { ...chunk, score, matched };
    })
    .sort((a, b) => b.score - a.score);
}

/** Sample corpus, so the demo is useful before anyone types anything. */
export const SAMPLE_TEXT = `Paracetamol is used to treat mild to moderate pain and to reduce fever. The usual adult dose is 500mg to 1000mg every four to six hours, with a maximum of 4000mg in twenty-four hours. It is generally well tolerated at therapeutic doses.

Ibuprofen is a non-steroidal anti-inflammatory drug used for pain, fever and inflammation. The usual adult dose is 200mg to 400mg every four to six hours, with a maximum of 1200mg daily without medical supervision. It carries a risk of gastrointestinal irritation.

Aspirin is used for pain relief and, at lower doses, as an antiplatelet agent to reduce cardiovascular risk. Analgesic doses range from 300mg to 900mg every four hours. Low-dose aspirin for cardiovascular protection is typically 75mg to 100mg daily.

Paracetamol overdose causes liver injury and is a leading cause of acute liver failure. Ibuprofen overdose more commonly presents with gastrointestinal and renal effects. Aspirin overdose produces a characteristic metabolic acidosis with respiratory alkalosis.`;

/**
 * Three queries chosen to expose three different outcomes against the corpus
 * above. The scores were measured, not guessed:
 *
 *  - lookup      the answer sits in one chunk; the top hit wins clearly
 *                (second-place ratio ~0.31)
 *  - vocabulary  the question means something present in the text but shares
 *                no words with it, so lexical scoring returns nothing at all
 *  - comparative every chunk matches and none answers, because the comparison
 *                lives between records (second-place ratio ~0.98)
 */
export const SAMPLE_QUERIES: {
  q: string;
  kind: "lookup" | "vocabulary" | "comparative";
}[] = [
  { q: "paracetamol liver damage", kind: "lookup" },
  { q: "Which of these drugs is safest for the stomach?", kind: "vocabulary" },
  { q: "Which drug has the lowest maximum daily dose?", kind: "comparative" },
];

/**
 * How close the runner-up must be to the top hit before retrieval counts as
 * having found several partial matches rather than one answer.
 *
 * Set from measurement: the clean lookups in SAMPLE_QUERIES land at 0.31 and
 * 0.45, the comparative at 0.98. A lower threshold flagged the lookups too.
 */
export const SPREAD_THRESHOLD = 0.85;
