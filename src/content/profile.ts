/**
 * Single source of truth for personal/professional facts.
 * Every value here is taken from the resume
 * `Kolchelma_Sai_Kiran_AI_ML_Engineer_Resume (1).pdf` (12 Sep 2026).
 * Do not add claims that are not on the resume or explicitly confirmed.
 */

export const profile = {
  name: "Kolchelma Sai Kiran",
  shortName: "Sai Kiran",
  title: "AI/ML Engineer",
  titleLong: "AI/ML Engineer — Generative AI & Agentic Systems",
  currentRole: "ML Associate — AI/ML Engineer",
  currentCompany: "Avira Digital Technologies",
  location: "Hyderabad, Telangana, India",
  email: "Ksaikiran129@gmail.com",
  /** Intentionally NOT rendered on public pages — scraper bait. Dashboard only. */
  phone: "7288856432",
  tagline: "Building intelligent systems with LLMs, agentic workflows, and retrieval.",
  summary:
    "AI/ML Engineer with 2+ years of combined full-time, internship and freelance experience building enterprise Generative AI, agentic AI, and RAG systems for pharmaceutical and business intelligence use cases. Experienced in LangGraph, LangChain, CrewAI, MCP, Graph RAG, LLM evaluation, and FastAPI. Contributed to enterprise AI platforms involving clinical knowledge retrieval, multi-agent data structuring, safety guardrails, and natural-language-to-SQL workflows. Strong foundation in Python, machine learning, NLP, and LLM application engineering.",
  availableForFreelance: true,
  links: {
    linkedin: "https://www.linkedin.com/in/ksaikiran129/",
    github: "https://github.com/saikirankolchelma",
    email: "mailto:Ksaikiran129@gmail.com",
  },
  /**
   * Experience figure, counting full-time, internship and freelance work.
   * NOTE: the resume currently says "1+ years" and counts only employment.
   * Keep the two in step — a recruiter comparing them will notice.
   */
  experienceLabel: "2+ years",
  /** What that figure is counting. Used wherever the number is explained. */
  experienceBasis: "full-time, internship and freelance work",
} as const;

export const education = [
  {
    institution: "TKR College of Engineering and Technology",
    degree: "B.Tech, Computer Science",
    specialization: "Data Science Specialization",
    period: "2021 — 2024",
    location: "Hyderabad, India",
  },
] as const;

export const certifications = [
  {
    name: "Data Science for Engineering",
    issuer: "NPTEL (IIT Madras)",
    type: "certification",
  },
  {
    name: "ML & Deep Learning Fundamentals",
    issuer: "NPTEL (IIT Guwahati)",
    type: "certification",
  },
  {
    name: "1st Rank — AIML EduNext Hackathon",
    issuer: "AIML EduNext",
    type: "achievement",
  },
] as const;

export type Certification = (typeof certifications)[number];
