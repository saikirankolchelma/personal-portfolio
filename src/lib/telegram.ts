import "server-only";

/**
 * Telegram Bot API client — only the two calls this project needs.
 * The bot token is read from the environment on each call and never leaves
 * the server.
 */

const API = "https://api.telegram.org";

export function isTelegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ALLOWED_USER_ID,
  );
}

/** The single Telegram account permitted to read or change anything. */
export function allowedTelegramUserId() {
  return process.env.TELEGRAM_ALLOWED_USER_ID?.trim() ?? null;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  { replyToMessageId }: { replyToMessageId?: number } = {},
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set.");

  const response = await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(replyToMessageId ? { reply_parameters: { message_id: replyToMessageId } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // Logged, not thrown: a failed confirmation must not cost us the task
    // that was already written to the database.
    console.error("[telegram] sendMessage failed", response.status, body.slice(0, 300));
  }
}

/** HTML-escapes user or model text before it goes into a formatted message. */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
