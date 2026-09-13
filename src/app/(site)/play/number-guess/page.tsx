import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { NumberGuess } from "@/components/games/number-guess";

export const metadata: Metadata = {
  title: "Number Guess",
  description: "Find the hidden number in as few guesses as possible, and watch the search space shrink.",
  alternates: { canonical: "/play/number-guess" },
};

export default function Page() {
  return (
    <PlayShell slug="number-guess">
      <NumberGuess />
    </PlayShell>
  );
}
