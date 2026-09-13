import { NextResponse } from "next/server";
import { z } from "zod";

import {
  GEMINI_MODEL,
  buildSystemInstruction,
  getGeminiClient,
  isGeminiConfigured,
} from "@/lib/gemini";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { profile } from "@/content/profile";

export const runtime = "nodejs";
/** Conversations are per-request; nothing here is cacheable. */
export const dynamic = "force-dynamic";

/** Keep the window small — it bounds both cost and prompt-injection surface. */
const MAX_HISTORY_TURNS = 12;

const chatSchema = z.object({
  message: z.string().trim().min(1, "Ask me something.").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().max(4000),
      }),
    )
    .max(40)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error: `The assistant is not connected yet. You can reach Sai Kiran directly at ${profile.email}.`,
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  const ip = clientIp(request.headers);
  const limit = rateLimit(`chat:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `That is a lot of questions. Take a short break, or email Sai Kiran at ${profile.email}.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const { message, history } = parsed.data;

  // Only the most recent turns are replayed, and the history arrives from the
  // client — so it is treated as untrusted content, never as instruction. The
  // system instruction is re-sent on every call and cannot be overwritten by it.
  const contents = [
    ...history.slice(-MAX_HISTORY_TURNS).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    const stream = await getGeminiClient().models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(),
        maxOutputTokens: 800,
        temperature: 0.4,
        // The profile is long; without a thinking budget of zero, short factual
        // answers spend most of their token allowance before emitting text.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          console.error("[chat] stream failed mid-response", error);
          // The client has already rendered part of an answer, so finish with
          // a readable note rather than an abrupt cut-off.
          controller.enqueue(
            encoder.encode(
              "\n\n(Sorry — the response was cut short. Please try asking again.)",
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[chat] request failed", error);
    return NextResponse.json(
      {
        error: `The assistant is having trouble right now. You can reach Sai Kiran at ${profile.email}.`,
      },
      { status: 502 },
    );
  }
}
