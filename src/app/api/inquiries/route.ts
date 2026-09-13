import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validation";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { profile } from "@/content/profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(payload);

  if (!parsed.success) {
    // Surface per-field messages so the form can highlight the right inputs.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Honeypot: a filled `website` field means a bot. Accept silently so the
  // bot has nothing to learn from the response, but write nothing.
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const ip = clientIp(request.headers);
  const limit = rateLimit(`inquiry:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many submissions. Try again later, or email me directly at ${profile.email}.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  if (!isDatabaseConfigured()) {
    // Better an honest failure with a working fallback than a fake success.
    return NextResponse.json(
      {
        error: "The inquiry form is not connected yet.",
        fallbackEmail: profile.email,
      },
      { status: 503 },
    );
  }

  try {
    await prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        projectType: data.projectType,
        description: data.description,
        budgetRange: data.budgetRange || null,
        timeline: data.timeline || null,
        requirements: data.requirements || null,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      },
    });
  } catch (error) {
    console.error("[inquiries] failed to persist inquiry", error);
    return NextResponse.json(
      {
        error: "Could not save your inquiry.",
        fallbackEmail: profile.email,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
