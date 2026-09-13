import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { TicTacToe } from "@/components/games/tic-tac-toe";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe",
  description:
    "Play Tic-Tac-Toe against a minimax opponent — on the hardest setting it never loses.",
  alternates: { canonical: "/play/tic-tac-toe" },
};

export default function TicTacToePage() {
  return (
    <PlayShell slug="tic-tac-toe">
      <TicTacToe />
    </PlayShell>
  );
}
