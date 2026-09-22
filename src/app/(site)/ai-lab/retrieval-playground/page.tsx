import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { RagPlayground } from "@/components/sections/rag-playground";
import { Section } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Retrieval Playground",
  description:
    "An interactive RAG demo — real chunking and Okapi BM25 scoring, running in your browser, showing exactly which chunks a query retrieves and where lexical retrieval breaks down.",
  alternates: { canonical: "/ai-lab/retrieval-playground" },
};

export default function RetrievalPlaygroundPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="container-px relative py-14 sm:py-20">
          <Link
            href="/ai-lab"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            AI Lab
          </Link>

          <p className="mb-4 mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Interactive
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.12] sm:text-5xl">
            Retrieval Playground
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
            Most RAG explanations stop at &ldquo;it finds relevant chunks&rdquo;.
            This one shows the actual mechanism — paste your own text, watch it
            chunk, and see precisely which passages a query pulls back and why.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-subtle">
            Then try the comparative question. That is where it gets interesting.
          </p>
        </div>
      </section>

      <Section>
        <RagPlayground />
      </Section>
    </>
  );
}
