/**
 * Narrative content for the About page.
 *
 * Everything factual here traces to the resume. The narrative connects those
 * facts; it does not add new ones. `personalInterests` is intentionally empty
 * - fill it in yourself rather than having anything invented. The section
 * does not render while the array is empty.
 */

export type JourneyStage = {
  period: string;
  title: string;
  subtitle: string;
  body: string;
  kind: "education" | "work" | "learning";
};

export const journey: JourneyStage[] = [
  {
    period: "2021 — 2024",
    title: "B.Tech, Computer Science (Data Science)",
    subtitle: "TKR College of Engineering and Technology",
    kind: "education",
    body: "Four years on the data science specialization - the statistics, machine learning and deep learning foundation that the later LLM work sits on top of. Alongside the coursework: NPTEL certifications from IIT Madras and IIT Guwahati, and a first-place finish at the AIML EduNext Hackathon.",
  },
  {
    period: "Feb 2025 — Apr 2025",
    title: "AI Engineer Intern",
    subtitle: "BiHub Solutions (Innovative Office Solutions)",
    kind: "work",
    body: "First production LLM work. The problem was dashboard migration - hundreds of Tableau workbooks that needed rebuilding in Power BI by hand. The answer turned out to be a split one: deterministic XML parsers for structure, LLM agents only for the part that genuinely needs judgment, expression translation. It reached 85-90% conversion accuracy under the project's evaluation criteria, and taught me where an LLM belongs in a pipeline and where it does not.",
  },
  {
    period: "Sep 2025 — Present",
    title: "ML Associate — AI/ML Engineer",
    subtitle: "Avira Digital Technologies",
    kind: "work",
    body: "Enterprise agentic AI, at the scale where the hard problems stop being about prompts. Contributing across an internal platform - a provider-agnostic LLM gateway, MCP tool servers, layered agent memory, safety guardrails and an LLM-as-judge evaluation harness - and to client retrieval systems in the pharmaceutical domain, including a clinical knowledge graph RAG and a multi-agent data structuring platform.",
  },
];

export const focusNow = [
  {
    title: "Retrieval past the naive baseline",
    body: "Most RAG demos work because the question and the answer share vocabulary. The interesting cases are the ones where they do not - relationship questions, multi-hop reasoning, and domains where the structure of the data matters more than the wording of any single chunk.",
  },
  {
    title: "Agents that can be measured",
    body: "Agent quality is easy to assert and hard to demonstrate. Judge harnesses, labeled datasets and shadow evaluation are what turn “this feels better” into something you can regress against between iterations.",
  },
  {
    title: "Cost and latency as design constraints",
    body: "Routing every query to the largest model is a decision, not a default - and usually the wrong one. Complexity classification, cost-tiered dispatch and caching are where a system stops being a demo.",
  },
];

export const goals = [
  "Go deeper on agent reliability - planning, memory and recovery when a tool call fails.",
  "Keep building evaluation infrastructure, because it is the part that compounds.",
  "Work on retrieval systems where the domain structure is genuinely hard, not just large.",
  "Take on selected freelance builds that push into territory my day job does not cover.",
];

/**
 * Non-technical interests. Left empty on purpose - add your own rather than
 * having anything guessed. The About page skips the section while it is empty.
 */
export const personalInterests: { label: string; note?: string }[] = [];
