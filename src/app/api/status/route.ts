import { NextResponse } from "next/server";

import { isGeminiConfigured } from "@/lib/gemini";
import { isDatabaseConfigured } from "@/lib/db";
import { projects } from "@/content/projects";
import { interestAreas } from "@/content/ai-lab";
import { availability } from "@/content/freelance";
import { profile } from "@/content/profile";

export const runtime = "nodejs";
/** Recomputed hourly — the values move on deploys, not on requests. */
export const revalidate = 3600;

/**
 * Public status of the live services on this site.
 *
 * Read by the live status panel on the home page, so the site reports what is
 * actually running rather than a claim typed once and left to rot.
 *
 * Reports only whether a capability is up, never how it is implemented —
 * the model in use is an implementation detail that would date fast and
 * tells a visitor nothing worth knowing.
 *
 * Strictly public data. Nothing here touches tasks, journal entries, notes,
 * inquiries or any other private table — it reports *whether* a capability is
 * configured, never anything it holds. Adding a private figure to this
 * response would publish it to anyone who loads the profile.
 */
export async function GET() {
  const assistantUp = isGeminiConfigured();

  return NextResponse.json(
    {
      name: profile.name,
      role: profile.currentRole,
      company: profile.currentCompany,
      experience: profile.experienceLabel,

      // Live capability status.
      assistant: assistantUp ? "online" : "offline",
      voice: assistantUp ? "enabled" : "disabled",
      workspace: isDatabaseConfigured() ? "connected" : "offline",

      // Public content counts.
      projects: projects.length,
      focusAreas: interestAreas.filter((a) => a.level === "applied").length,

      availability: availability.open ? "open" : "closed",
      focus: "Agentic AI · Graph RAG · LLM Evaluation",
      updated: new Date().toISOString(),
    },
    {
      headers: {
        // Badge services cache aggressively; let them, but allow a stale read
        // rather than a broken badge while revalidating.
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
