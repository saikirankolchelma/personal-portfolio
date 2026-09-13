import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { TypingTest } from "@/components/games/typing-test";

export const metadata: Metadata = {
  title: "Typing Speed Test",
  description: "Measure your words per minute and accuracy on passages about AI engineering.",
  alternates: { canonical: "/play/typing" },
};

export default function Page() {
  return (
    <PlayShell slug="typing">
      <TypingTest />
    </PlayShell>
  );
}
