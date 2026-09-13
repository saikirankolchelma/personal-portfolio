import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayShell } from "@/components/play-shell";
import { Quiz } from "@/components/games/quiz";
import { getQuiz } from "@/content/quizzes";

export const metadata: Metadata = {
  title: "DSA Quiz",
  description: "Ten questions on complexity, trees, graphs and classic algorithms, each with an explanation.",
  alternates: { canonical: "/play/dsa-quiz" },
};

export default function Page() {
  const quiz = getQuiz("dsa-quiz");
  if (!quiz) notFound();

  return (
    <PlayShell slug="dsa-quiz">
      <Quiz quiz={quiz} />
    </PlayShell>
  );
}
