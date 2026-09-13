import type { Metadata } from "next";
import { PlayShell } from "@/components/play-shell";
import { Pomodoro } from "@/components/tools/pomodoro";

export const metadata: Metadata = {
  title: "Pomodoro Timer",
  description:
    "A focus timer with configurable work and break lengths, session counting and a finish chime.",
  alternates: { canonical: "/play/pomodoro" },
};

export default function PomodoroPage() {
  return (
    <PlayShell slug="pomodoro">
      <Pomodoro />
    </PlayShell>
  );
}
