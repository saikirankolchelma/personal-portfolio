import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { WordCounter } from "@/components/tools/word-counter";

export const metadata: Metadata = {
  title: "Word Counter",
  description: "Word, character and sentence counts with reading time, computed in your browser.",
  alternates: { canonical: "/play/word-counter" },
};

export default function Page() {
  return (
    <PlayShell slug="word-counter">
      <WordCounter />
    </PlayShell>
  );
}
