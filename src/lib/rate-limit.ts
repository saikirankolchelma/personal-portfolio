import { createHash } from "node:crypto";

/**
 * Minimal fixed-window limiter kept in process memory.
 *
 * Caveat worth knowing: serverless instances do not share memory, so this
 * throttles a single instance rather than the whole deployment. It is enough
 * to blunt naive form spam. If inquiry volume ever justifies it, swap the Map
 * for Redis/Upstash — the call signature will not need to change.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60 * 60 * 1000 } = {},
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    windows.set(key, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return { ok, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Never store a raw IP — a salted hash is enough for abuse review. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
