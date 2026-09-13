import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayShell } from "@/components/play-shell";
import { Quiz } from "@/components/games/quiz";
import { getQuiz } from "@/content/quizzes";

export const metadata: Metadata = {
  title: "AI & ML Quiz",
  description: "Ten questions on LLMs, retrieval, fine-tuning and agent safety, each with an explanation.",
  alternates: { canonical: "/play/ai-quiz" },
};

export default function Page() {
  const quiz = getQuiz("ai-quiz");
  if (!quiz) notFound();

  return (
    <PlayShell slug="ai-quiz">
      <Quiz quiz={quiz} />
    </PlayShell>
  );
}
