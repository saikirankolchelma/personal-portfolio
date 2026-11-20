import { profile } from "@/content/profile";

export type ChatTurn = { role: "user" | "model"; content: string };
export type ChatPersona = "assistant" | "host";

/**
 * Streams an answer from /api/chat, calling `onText` with the full text so
 * far after every chunk. Resolves to the complete answer.
 *
 * Throws an Error whose message is safe to show (and speak) to a visitor;
 * an aborted request rethrows the AbortError for the caller to ignore.
 */
export async function streamChat({
  message,
  history,
  persona = "assistant",
  voice = false,
  signal,
  onText,
}: {
  message: string;
  history: ChatTurn[];
  persona?: ChatPersona;
  /** The answer will be spoken — the server picks its fast voice model. */
  voice?: boolean;
  signal?: AbortSignal;
  onText?: (text: string) => void;
}): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-12), persona, voice }),
    signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error ?? `The agent is unavailable right now. You can email ${profile.email}.`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText?.(full);
  }

  if (!full.trim()) throw new Error("I did not catch a response. Please try again.");
  return full;
}

/** Strips the light markdown a model may return, for captions. */
export function plainText(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}
