import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { Snake } from "@/components/games/snake";

export const metadata: Metadata = {
  title: "Snake",
  description:
    "The classic Snake game — keyboard or touch controls, with your high score saved locally.",
  alternates: { canonical: "/play/snake" },
};

export default function SnakePage() {
  return (
    <PlayShell slug="snake">
      <Snake />
    </PlayShell>
  );
}
