import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { ChessGame } from "@/components/games/chess";

export const metadata: Metadata = {
  title: "Chess",
  description: "Play chess against a negamax engine with alpha-beta pruning and full rule support.",
  alternates: { canonical: "/play/chess" },
};

export default function Page() {
  return (
    <PlayShell slug="chess">
      <ChessGame />
    </PlayShell>
  );
}
