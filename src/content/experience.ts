/**
 * Professional experience. Facts, dates and titles come from
 * `Kolchelma_Sai_Kiran_AI_ML_Engineer_Resume (1).pdf` (12 Sep 2026).
 * Supplementary bullet detail is drawn from the longer resume variant
 * `Saikiran_Kolchelma_AI_ML_Engineer_2026.docx` — same facts, more detail.
 *
 * Framing rule: contributions are described as contributions. Nothing here
 * claims sole ownership of a team-built system.
 */

export type Workstream = {
  name: string;
  client?: string;
  context: string;
  bullets: string[];
};

export type Experience = {
  slug: string;
  company: string;
  role: string;
  employmentType: "Full-time" | "Internship";
  start: string;
  end: string | null;
  /** Human-readable duration shown next to the dates. */
  duration?: string;
  location: string;
  summary: string;
  workstreams: Workstream[];
  tech: string[];
  current: boolean;
};

export const experiences: Experience[] = [
  {
    slug: "avira-digital",
    company: "Avira Digital Technologies",
    role: "ML Associate — AI/ML Engineer",
    employmentType: "Full-time",
    start: "Sep 2025",
    end: null,
    location: "Hyderabad, India",
    current: true,
    summary:
      "Working on an enterprise agentic AI platform and client-facing retrieval systems for pharmaceutical and business intelligence use cases — agent orchestration, MCP tooling, safety guardrails, and evaluation.",
    workstreams: [
      {
        name: "Enterprise Agentic AI Platform — Athena",
        context:
          "Internal product. Contributed across R&D, design and implementation of the platform's agent orchestration, tooling and evaluation layers as part of the engineering team.",
        bullets: [
          "Developed an LLM gateway integrating OpenAI, IBM watsonx, and Meta Llama models through Azure and direct provider APIs, enabling provider-agnostic model selection and avoiding single-vendor lock-in.",
          "Designed MCP servers using SSE and stdio transports to standardize tool access across enterprise agents.",
          "Implemented multi-layer agent memory workflows — short-term, long-term and episodic — for contextual continuity across sessions.",
          "Built an LLM-as-judge evaluation harness that scores agent responses against a labeled query/response dataset.",
          "Implemented input/output safety guardrails covering PII/PHI, jailbreaks, harm, social bias, profanity, and prompt injection, alongside IBM Guardrails.",
          "Integrated external data and tool nodes spanning social platforms, medical sources (PubMed, DrugBank, ClinicalTrials.gov, FDA), and relational databases (PostgreSQL, MySQL).",
          "Delivered a social-sentiment analytics workflow orchestrating agents to pull and analyze posts and comments across multiple platforms.",
        ],
      },
      {
        name: "Clinical Knowledge Graph RAG",
        client: "BMS Client",
        context:
          "Research-facing Q&A over clinical trial, drug and disease data. Started as a traditional RAG pipeline and was redesigned as a Graph RAG once relationship modeling became the bottleneck.",
        bullets: [
          "Built and evaluated metadata-aware RAG using hybrid semantic and BM25 retrieval over clinical trial, drug, and disease data; identified its limits in modeling many-to-many drug–disease–dosage relationships.",
          "Contributed to the Graph RAG redesign using Neo4j to model drug–disease–dosage relationships, and evaluated AWS Neptune for larger-scale ingestion.",
          "Developed natural-language-to-Cypher and natural-language-to-Gremlin query translation workflows for graph-based clinical question answering.",
          "Iterated on embedding and metadata strategies to improve entity-relationship linking, informing the team's subsequent RAG architecture decisions.",
        ],
      },
      {
        name: "Agentic Data Structuring & Query Platform",
        client: "BMS Client",
        context:
          "A multi-stage pipeline that ingests raw, multi-source data and restructures it into tagged, categorized records for downstream querying.",
        bullets: [
          "Developed 10+ specialized LangGraph agents for sentiment analysis, thematic clustering, and entity extraction within an orchestrator/sub-agent architecture.",
          "Built MCP servers exposing schema-introspection and query-execution tools for natural-language-to-SQL workflows.",
          "Contributed to multi-stage data structuring pipelines using topic modeling to group related content before records are written to the database.",
          "Embedded business-logic and governance rules as structured context files to keep agent-generated answers aligned with client data-governance policy.",
        ],
      },
    ],
    tech: [
      "LangGraph", "LangChain", "CrewAI", "MCP", "Neo4j", "AWS Neptune",
      "Cypher", "Gremlin", "PostgreSQL", "MySQL", "BM25", "Hybrid Search",
      "IBM watsonx", "Azure OpenAI", "Meta Llama", "FastAPI", "Python",
    ],
  },
  {
    slug: "bihub-solutions",
    company: "BiHub Solutions (Innovative Office Solutions)",
    role: "AI Engineer Intern",
    employmentType: "Internship",
    start: "Feb 2025",
    end: "Apr 2025",
    duration: "3 months",
    location: "Hyderabad, India",
    current: false,
    summary:
      "Built LLM agents and parsers that automated Tableau-to-Power BI dashboard migration, plus the FastAPI service layer exposing them to the wider pipeline.",
    workstreams: [
      {
        name: "Tableau → Power BI Migration Automation",
        context:
          "Agent-driven conversion of enterprise Tableau dashboards into Power BI equivalents, reducing manual rebuild effort.",
        bullets: [
          "Developed LangGraph/LangChain agents for Tableau-to-Power BI migration, achieving 85–90% conversion accuracy under project evaluation criteria.",
          "Built custom parsers for Tableau (.twb) XML files to extract chart types, calculated fields, filters, and axis configurations.",
          "Used LLM agents to auto-generate equivalent DAX queries and Power Query (M) scripts for Power BI.",
          "Developed the FastAPI service layer exposing the chatbot and automation agents to the rest of the migration pipeline.",
        ],
      },
    ],
    tech: ["LangGraph", "LangChain", "FastAPI", "Python", "Power BI", "DAX", "Power Query (M)", "XML Parsing"],
  },
];

export const experienceHighlights = [
  { label: "Experience", value: "1+ yrs", note: "Full-time + internship" },
  { label: "LangGraph agents built", value: "10+", note: "Orchestrator / sub-agent" },
  { label: "Migration accuracy", value: "85–90%", note: "Tableau → Power BI" },
  { label: "Model providers integrated", value: "3", note: "OpenAI, watsonx, Llama" },
];
