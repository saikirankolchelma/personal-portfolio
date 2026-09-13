/**
 * Client-safe assistant copy. Kept out of `lib/knowledge.ts` because that
 * module is server-only — the suggestions need to render in the widget.
 *
 * Every question here must be answerable from the verified profile.
 */

export const assistantIntro =
  "Ask me about Sai Kiran's experience, projects, or freelance availability. I answer from his verified portfolio — if I don't know something, I'll say so.";

export const suggestedQuestions = [
  "What does Sai Kiran do?",
  "What RAG projects has he built?",
  "Is he available for freelance work?",
  "What's his experience with AI agents?",
  "What technologies does he work with?",
];

export const assistantDisclaimer =
  "AI assistant — answers come from Sai Kiran's published portfolio and can be imperfect.";
