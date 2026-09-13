import "server-only";

import { profile, education, certifications } from "@/content/profile";
import { experiences } from "@/content/experience";
import { projects } from "@/content/projects";
import { skillGroups } from "@/content/skills";
import { interestAreas, levelMeta } from "@/content/ai-lab";
import { availability, services } from "@/content/freelance";
import { formatPeriod } from "@/lib/utils";

/**
 * Compiles the public content layer into a single grounding document for the
 * assistant.
 *
 * Building this from the same modules the pages render is the whole point: the
 * assistant cannot drift from the site, because there is one source of truth.
 * Anything absent here is, by construction, something the assistant does not
 * know — which is exactly the behaviour we want.
 *
 * Deliberately excluded: the phone number, and every private table (tasks,
 * journal, notes). This module imports no database code at all, so there is no
 * path from the public assistant to private data even by mistake.
 */

function experienceSection() {
  return experiences
    .map((exp) => {
      const workstreams = exp.workstreams
        .map(
          (ws) =>
            `  - ${ws.name}${ws.client ? ` (${ws.client})` : ""}\n` +
            `    Context: ${ws.context}\n` +
            ws.bullets.map((b) => `    * ${b}`).join("\n"),
        )
        .join("\n\n");

      return [
        `### ${exp.role} — ${exp.company}`,
        `Employment type: ${exp.employmentType}`,
        `Dates: ${formatPeriod(exp.start, exp.end)}${exp.duration ? ` (${exp.duration})` : ""}`,
        `Location: ${exp.location}`,
        `Summary: ${exp.summary}`,
        `Workstreams:\n${workstreams}`,
        `Technologies: ${exp.tech.join(", ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

function projectSection() {
  return projects
    .map((p) =>
      [
        `### ${p.name}`,
        `Page: /projects/${p.slug}`,
        `Categories: ${p.category.join(", ")}`,
        `Where: ${p.origin}`,
        `Role: ${p.role}`,
        `Period: ${p.period} — Status: ${p.status}`,
        p.confidential
          ? "NOTE: client/employer work. Only the detail published here may be shared; there is nothing more you can disclose."
          : "Self-directed / personal project.",
        `Summary: ${p.tagline}`,
        `Problem: ${p.problem}`,
        `Why it mattered: ${p.why}`,
        `Approach: ${p.solution}`,
        `Architecture:\n${p.architecture.map((a) => `  * ${a}`).join("\n")}`,
        `AI/ML components: ${p.aiComponents.join("; ")}`,
        `Challenges:\n${p.challenges.map((c) => `  * ${c.challenge} -> ${c.response}`).join("\n")}`,
        p.results.length > 0
          ? `Verified results: ${p.results.map((r) => `${r.label}: ${r.value}`).join("; ")}`
          : "Verified results: NONE PUBLISHED. Do not state or estimate any metric for this project.",
        `Technologies: ${p.tech.join(", ")}`,
        `Source repository: ${p.repo ?? "not published"}`,
        `Live demo: ${p.demo ?? "none"}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function skillsSection() {
  return skillGroups
    .map((g) => `- ${g.label} (${g.note}): ${g.items.join(", ")}`)
    .join("\n");
}

function aiLabSection() {
  return interestAreas
    .map(
      (a) =>
        `- ${a.title} [${levelMeta[a.level].label}] — ${a.blurb}\n  Topics: ${a.topics.join(", ")}`,
    )
    .join("\n");
}

function freelanceSection() {
  const serviceList = services
    .map((s) => `- ${s.title}: ${s.description}\n  Backed by: ${s.backedBy}`)
    .join("\n");

  return [
    `Availability: ${availability.open ? "OPEN to selected freelance projects" : "not currently taking projects"}`,
    `Detail: ${availability.detail}`,
    `Capacity: ${availability.capacity}`,
    `Typical response time: ${availability.responseTime}`,
    `Works with: ${availability.workingWith.join(", ")}`,
    `Inquiry form: /freelance#inquiry`,
    "",
    "Services offered:",
    serviceList,
  ].join("\n");
}

let cached: string | null = null;

export function buildKnowledgeBase(): string {
  if (cached) return cached;

  cached = [
    "# VERIFIED PROFILE — Kolchelma Sai Kiran",
    "",
    "## Identity",
    `Full name: ${profile.name}`,
    `Goes by: ${profile.shortName}`,
    `Professional title: ${profile.titleLong}`,
    `Current role: ${profile.currentRole} at ${profile.currentCompany}`,
    `Location: ${profile.location}`,
    `Experience: ${profile.experienceLabel} (full-time plus internship)`,
    `Email: ${profile.email}`,
    `LinkedIn: ${profile.links.linkedin}`,
    `GitHub: ${profile.links.github}`,
    "",
    "## Professional summary",
    profile.summary,
    "",
    "## Experience",
    experienceSection(),
    "",
    "## Education",
    education
      .map(
        (e) =>
          `- ${e.degree} (${e.specialization}), ${e.institution}, ${e.period}, ${e.location}`,
      )
      .join("\n"),
    "",
    "## Certifications and achievements",
    certifications.map((c) => `- ${c.name} — ${c.issuer}`).join("\n"),
    "",
    "## Technical skills",
    skillsSection(),
    "",
    "## Projects",
    projectSection(),
    "",
    "## AI Lab — interest areas",
    "Levels are stated honestly: 'Applied in production work' means shipped professionally; 'Hands-on' means built in self-directed projects; 'Exploring' means actively learning but not yet shipped. Never upgrade a level when answering.",
    aiLabSection(),
    "",
    "## Freelancing",
    freelanceSection(),
    "",
    "## Site map",
    "- / — home",
    "- /about — career journey, skills, education",
    "- /experience — full professional timeline",
    "- /projects — all projects, each with a detailed breakdown page",
    "- /ai-lab — interest and learning areas",
    "- /freelance — services and the project inquiry form",
    "- /contact — contact channels",
    "- /play — games and productivity tools",
  ].join("\n");

  return cached;
}
