import "dotenv/config";

/**
 * Registers (or inspects) the Telegram webhook.
 *
 *   npm run telegram:setup            -- register using NEXT_PUBLIC_SITE_URL
 *   npm run telegram:setup -- info    -- show what Telegram currently has
 *   npm run telegram:setup -- delete  -- unregister
 *
 * Telegram requires HTTPS, so for local testing point it at a tunnel
 * (ngrok, cloudflared) rather than localhost.
 */

const API = "https://api.telegram.org";

async function call(token: string, method: string, body?: unknown) {
  const response = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return response.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>;
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const mode = process.argv[2] ?? "set";

  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set in .env.local");

  if (mode === "info") {
    const info = await call(token, "getWebhookInfo");
    console.log(JSON.stringify(info.result, null, 2));
    return;
  }

  if (mode === "delete") {
    const result = await call(token, "deleteWebhook", { drop_pending_updates: true });
    console.log(result.ok ? "Webhook removed." : `Failed: ${result.description}`);
    return;
  }

  if (!secret || secret.length < 16) {
    throw new Error(
      "TELEGRAM_WEBHOOK_SECRET must be set and at least 16 characters. Generate one with: openssl rand -hex 24",
    );
  }
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an https URL (Telegram requires TLS). Got: ${baseUrl ?? "unset"}`,
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const result = await call(token, "setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });

  if (!result.ok) throw new Error(result.description ?? "setWebhook failed");

  console.log(`Webhook registered: ${url}`);

  const me = await call(token, "getMe");
  const bot = me.result as { username?: string } | undefined;
  if (bot?.username) console.log(`Bot: @${bot.username}`);

  const allowed = process.env.TELEGRAM_ALLOWED_USER_ID;
  console.log(
    allowed
      ? `Only Telegram user id ${allowed} may create tasks.`
      : "WARNING: TELEGRAM_ALLOWED_USER_ID is not set — every message will be refused.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
