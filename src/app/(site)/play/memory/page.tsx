import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { Memory } from "@/components/games/memory";

export const metadata: Metadata = {
  title: "Memory Match",
  description: "Match pairs of AI engineering terms in as few moves as you can.",
  alternates: { canonical: "/play/memory" },
};

export default function Page() {
  return (
    <PlayShell slug="memory">
      <Memory />
    </PlayShell>
  );
}
