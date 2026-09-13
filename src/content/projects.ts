/**
 * Project showcase.
 *
 * Rules applied here:
 *  - Enterprise/client work is described only at the level of detail that
 *    already appears on the public resume. No confidential client specifics.
 *  - `results` holds only figures that are verified. Where none exist, the
 *    array is empty and the UI simply does not render a results block.
 *  - `repo` / `demo` are null unless a real URL is known. Never invent one.
 */

export type ProjectCategory =
  | "Enterprise AI"
  | "Agentic AI"
  | "RAG"
  | "AI Infrastructure"
  | "NLP"
  | "Personal";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  category: ProjectCategory[];
  /** Where the work happened. */
  origin: string;
  role: string;
  period: string;
  status: "Active" | "Delivered" | "In Progress" | "Archived";
  featured: boolean;
  /** True for client/employer work - the UI shows a confidentiality note. */
  confidential: boolean;
  tech: string[];
  problem: string;
  why: string;
  solution: string;
  architecture: string[];
  implementation: string[];
  aiComponents: string[];
  challenges: { challenge: string; response: string }[];
  results: { label: string; value: string }[];
  future: string[];
  repo: string | null;
  demo: string | null;
};

export const projects: Project[] = [
  {
    slug: "athena-agentic-platform",
    name: "Athena — Enterprise Agentic AI Platform",
    tagline:
      "Provider-agnostic LLM gateway, MCP tool servers, layered agent memory, guardrails and an LLM-as-judge evaluation harness.",
    category: ["Enterprise AI", "Agentic AI"],
    origin: "Avira Digital Technologies — internal product",
    role: "ML Associate — contributed across R&D, design and implementation of the orchestration, tooling and evaluation layers as part of the engineering team.",
    period: "Sep 2025 — Present",
    status: "Active",
    featured: true,
    confidential: true,
    tech: [
      "LangChain",
      "CrewAI",
      "LangGraph",
      "MCP",
      "SSE",
      "Python",
      "FastAPI",
      "Azure OpenAI",
      "IBM watsonx",
      "Meta Llama",
      "PostgreSQL",
      "MySQL",
    ],
    problem:
      "Enterprise teams needed agents that could reach real tools and real data without hard-wiring the whole platform to one model vendor, one tool protocol, or one set of safety assumptions.",
    why:
      "Committing an enterprise platform to a single model provider is both a cost and a continuity risk, and every new tool integration written ad hoc becomes its own maintenance burden. A shared gateway, a standard tool protocol and a measurable evaluation loop were needed before the platform could be trusted with regulated data.",
    solution:
      "A layered platform: a universal LLM gateway underneath, MCP servers standardizing tool access above it, a multi-layer memory system for continuity, guardrails on both input and output, and an LLM-as-judge harness measuring whether any of it actually works.",
    architecture: [
      "LLM gateway — a single routing layer over OpenAI, IBM watsonx and Meta Llama, reached through Azure and direct provider APIs, so model choice becomes configuration rather than code.",
      "MCP tool layer — MCP servers exposed over both SSE and stdio transports, giving every agent one consistent way to discover and call tools.",
      "Tool & data nodes — integrations spanning social platforms, medical sources (PubMed, DrugBank, ClinicalTrials.gov, FDA) and relational databases (PostgreSQL, MySQL).",
      "Memory layer — short-term, long-term and episodic memory, keeping context coherent across turns and across sessions.",
      "Guardrail layer — input and output screening for PII/PHI, jailbreaks, harm, social bias, profanity and prompt injection, run alongside IBM's Guardrails service.",
      "Evaluation layer — a Judge Agent that scores responses against a labeled query/response dataset.",
    ],
    implementation: [
      "Built the gateway on LangChain and CrewAI so orchestration primitives stayed consistent regardless of which provider served a request.",
      "Implemented MCP servers with SSE transport for networked tools and stdio transport for local ones, so the same tool contract works in both deployment shapes.",
      "Wired medical and social data sources in as tool nodes rather than bespoke pipelines, keeping ingestion uniform.",
      "Implemented the three memory tiers with distinct retention and retrieval behavior instead of a single undifferentiated history buffer.",
      "Layered the platform's own guardrails with IBM Guardrails so that a miss in one layer is still caught by the other.",
      "Delivered a social-sentiment analytics workflow that orchestrates agents to pull and analyze posts and comments across multiple platforms.",
    ],
    aiComponents: [
      "Multi-provider LLM routing and model selection",
      "Multi-agent orchestration (LangChain + CrewAI)",
      "Short-term / long-term / episodic agent memory",
      "LLM-as-judge response scoring against labeled data",
      "Safety guardrails — PII/PHI, jailbreak, harm, bias, profanity, prompt injection",
      "Agent-driven sentiment analysis across social sources",
    ],
    challenges: [
      {
        challenge:
          "Each model provider exposes a different API surface, so provider choice tended to leak into application code.",
        response:
          "A universal gateway normalized the differences, leaving model selection as a configuration decision instead of a rewrite.",
      },
      {
        challenge:
          "Every new tool integration risked becoming its own bespoke protocol for agents to learn.",
        response:
          "MCP servers with SSE and stdio transports standardized tool access, so adding a tool did not mean teaching agents a new pattern.",
      },
      {
        challenge:
          "Agents handling medical and enterprise data cannot be allowed to leak PII/PHI or be talked out of their instructions.",
        response:
          "Input and output guardrails covering PII/PHI, jailbreaks, harm, bias, profanity and prompt injection, run in combination with IBM Guardrails.",
      },
      {
        challenge: "Without measurement, “the agent got better” is an opinion.",
        response:
          "A Judge Agent harness scoring responses against a labeled query/response dataset turned quality into something observable between iterations.",
      },
    ],
    results: [],
    future: [
      "Broaden the labeled evaluation set so judge scores generalize across more query types.",
      "Extend routing decisions to account for cost and latency, not just capability.",
    ],
    repo: null,
    demo: null,
  },
  {
    slug: "clinical-knowledge-graph-rag",
    name: "Clinical Knowledge Graph RAG",
    tagline:
      "A clinical Q&A retrieval system that moved from hybrid-search RAG to Graph RAG once relationship modeling became the real bottleneck.",
    category: ["RAG", "Enterprise AI"],
    origin: "Avira Digital Technologies — BMS client",
    role: "ML Associate — built and evaluated the initial RAG pipeline, contributed to the Graph RAG redesign and the natural-language-to-query translation layers.",
    period: "2025 — 2026",
    status: "Delivered",
    featured: true,
    confidential: true,
    tech: [
      "Neo4j",
      "AWS Neptune",
      "Cypher",
      "Gremlin",
      "BM25",
      "Hybrid Search",
      "LangChain",
      "Python",
      "Vector Embeddings",
    ],
    problem:
      "Researchers needed to ask free-text questions across clinical trial, drug and disease data — but the answers depend on many-to-many drug–disease–dosage relationships that chunk-based retrieval flattens and loses.",
    why:
      "A conventional RAG pipeline retrieves passages that look similar to the question. That works for definitional lookups and fails for relationship questions, where the answer is not contained in any single chunk but in how entities connect. Establishing that limit empirically was what justified the redesign.",
    solution:
      "Build the conventional pipeline first, evaluate it honestly, identify exactly where it broke, then model the domain as a graph and translate natural-language questions directly into graph queries.",
    architecture: [
      "Ingestion — clinical trial, drug and disease sources, chunked with metadata tagging so retrieval can filter as well as match.",
      "Retrieval v1 — hybrid retrieval combining semantic vector search with BM25 lexical search.",
      "Knowledge graph — entities and relationships modeled in Neo4j, capturing drug–disease–dosage links explicitly rather than implicitly.",
      "Scale evaluation — AWS Neptune assessed as an alternative for larger-scale ingestion.",
      "Query translation — agent-based layers converting free-text clinical questions into Cypher (Neo4j) and Gremlin (Neptune).",
      "Serving — a research-facing Q&A chatbot over the retrieval layer.",
    ],
    implementation: [
      "Built the metadata-tagged chunking strategy so retrieval could constrain by trial, drug or disease rather than relying on embedding similarity alone.",
      "Combined semantic and BM25 retrieval to cover both paraphrased and exact-term clinical queries.",
      "Evaluated the pipeline against relationship-heavy questions and documented where it could not represent many-to-many links.",
      "Modeled entities and relationships in Neo4j and contributed to the Graph RAG redesign built on that model.",
      "Built natural-language-to-Cypher and natural-language-to-Gremlin translation workflows so researchers never write query syntax.",
      "Iterated on embedding and metadata strategies to improve entity-relationship linking.",
    ],
    aiComponents: [
      "Hybrid retrieval — dense vector search + BM25",
      "Metadata-aware chunking and filtered retrieval",
      "Graph RAG over a Neo4j clinical knowledge graph",
      "Agent-based natural-language-to-Cypher translation",
      "Agent-based natural-language-to-Gremlin translation",
      "Retrieval evaluation across pipeline variants",
    ],
    challenges: [
      {
        challenge:
          "Chunk-based retrieval cannot represent many-to-many drug–disease–dosage relationships — the information exists between records, not inside one.",
        response:
          "Modeled those relationships explicitly as graph edges in Neo4j so a relationship question becomes a traversal instead of a similarity search.",
      },
      {
        challenge:
          "Clinical researchers ask questions in natural language; graphs answer in Cypher and Gremlin.",
        response:
          "Agent-based translation layers for both query languages, bridging free text and graph traversal.",
      },
      {
        challenge:
          "Neo4j suited the modeling work, but larger-scale ingestion raised different constraints.",
        response:
          "Evaluated AWS Neptune against the same workload to understand the scaling trade-off before committing.",
      },
    ],
    results: [
      {
        label: "Architecture outcome",
        value: "Findings informed the team's subsequent RAG architecture decisions",
      },
    ],
    future: [
      "Expand relationship coverage beyond drug–disease–dosage to additional clinical entity types.",
      "Formalize retrieval evaluation for graph traversal answers, not just passage relevance.",
    ],
    repo: null,
    demo: null,
  },
  {
    slug: "agentic-data-structuring",
    name: "Agentic Data Structuring & Query Platform",
    tagline:
      "An orchestrator/sub-agent pipeline that turns raw multi-source data into tagged, queryable records — and answers questions about it in plain English.",
    category: ["Agentic AI", "Enterprise AI", "NLP"],
    origin: "Avira Digital Technologies — BMS client",
    role: "ML Associate — developed the LangGraph sub-agents, the MCP schema/query tool servers, and the governance context integration.",
    period: "2026 — Present",
    status: "Active",
    featured: true,
    confidential: true,
    tech: [
      "LangGraph",
      "MCP",
      "Topic Modeling",
      "PostgreSQL",
      "Python",
      "FastAPI",
      "Natural Language to SQL",
    ],
    problem:
      "Raw data arrived from many sources with no consistent structure, which made it unusable for analysis — and even once structured, answering questions about it required someone who could write SQL.",
    why:
      "Manual tagging and categorization does not scale with ingestion volume, and a structured database that only engineers can query leaves most of its value unrealized. Both halves of the problem had to be solved for the data to be useful to the business.",
    solution:
      "A multi-stage agentic pipeline: specialized sub-agents structure and enrich records on the way in, and MCP-exposed schema-introspection and query tools let downstream agents answer natural-language questions by generating SQL against the live schema.",
    architecture: [
      "Ingestion stage — raw, multi-source data collected into a common staging shape.",
      "Structuring stage — topic modeling groups related content before records are categorized.",
      "Orchestrator/sub-agent layer — 10+ deep agents in LangGraph, each specialized: sentiment analysis, thematic clustering, entity extraction.",
      "Persistence — enriched, tagged records written to the database.",
      "MCP query layer — servers exposing schema-introspection and query-execution tools.",
      "Query stage — downstream agents translate natural-language questions into dynamic SQL against the introspected schema.",
      "Governance layer — business-logic and governance rules held as structured context files, constraining what agents may answer.",
    ],
    implementation: [
      "Developed 10+ specialized LangGraph agents under an orchestrator/sub-agent architecture, so each enrichment concern stayed independently testable.",
      "Split enrichment across sentiment analysis, thematic clustering and entity extraction sub-agents rather than asking one agent to do all three.",
      "Applied topic modeling to group related content ahead of categorization.",
      "Built MCP servers exposing schema-introspection and query-execution tools so SQL generation targets the real, current schema.",
      "Encoded business-logic and governance rules as structured context files so agent answers stay aligned with client data-governance policy.",
    ],
    aiComponents: [
      "Orchestrator/sub-agent architecture in LangGraph",
      "Sentiment analysis sub-agents",
      "Thematic clustering sub-agents",
      "Entity extraction sub-agents",
      "Topic modeling for content grouping",
      "Natural-language-to-SQL generation over introspected schemas",
      "Governance rules as structured agent context",
    ],
    challenges: [
      {
        challenge:
          "A single agent asked to structure, classify and extract at once is hard to debug and harder to improve.",
        response:
          "An orchestrator delegating to 10+ narrow sub-agents, each with one responsibility and its own failure mode.",
      },
      {
        challenge:
          "Generated SQL breaks the moment it assumes a schema that has drifted.",
        response:
          "MCP schema-introspection tools, so agents read the live schema before generating a query rather than relying on a snapshot.",
      },
      {
        challenge:
          "An agent that can query anything will eventually answer something it should not.",
        response:
          "Governance and business-logic rules supplied as structured context, keeping answers inside client policy.",
      },
    ],
    results: [{ label: "Specialized agents built", value: "10+" }],
    future: [
      "Widen sub-agent coverage to additional enrichment dimensions.",
      "Tighten query-generation evaluation against a labeled question/SQL set.",
    ],
    repo: null,
    demo: null,
  },
  {
    slug: "meta-rag-gateway",
    name: "Meta-RAG — Adaptive Model-Routing Gateway",
    tagline:
      "A self-directed inference gateway that classifies query complexity and routes across retrieval strategies and model tiers — then tunes its own thresholds.",
    category: ["AI Infrastructure", "RAG", "Personal"],
    origin: "Self-directed project",
    role: "Sole author — architecture, classifier fine-tuning, retrieval pipeline, evaluation harness and dashboard.",
    period: "Self-directed",
    status: "Delivered",
    featured: true,
    confidential: false,
    tech: [
      "Python",
      "PyTorch",
      "Transformers",
      "DeBERTa-v3",
      "FastAPI",
      "Qdrant",
      "Redis",
      "PostgreSQL",
      "Optuna",
      "Streamlit",
      "Docker",
    ],
    problem:
      "Sending every query to the most capable model and the most expensive retrieval strategy is wasteful — most questions do not need it — but routing by hand needs a definition of “hard” that nobody has written down.",
    why:
      "RAG systems typically apply one retrieval strategy uniformly. A definitional lookup and a multi-hop reasoning question have completely different needs, and paying the multi-hop cost for every query is how inference budgets disappear. The interesting problem is learning the routing decision rather than hard-coding it.",
    solution:
      "Fine-tune a complexity classifier on LLM-labeled queries, use it to drive a three-tier dispatcher across retrieval strategies and model tiers, then close the loop: an LLM judge scores each strategy in shadow mode and a Bayesian optimizer tunes the routing thresholds against an accuracy SLA.",
    architecture: [
      "FastAPI gateway — single entry point for incoming queries.",
      "Complexity classifier — a fine-tuned DeBERTa-v3-base model scoring each query.",
      "3-tier dispatcher — routes to naive, parent-document or HyDE retrieval, and to models of differing cost.",
      "Retrieval-ingestion pipeline — chunking, embedding and vector indexing in Qdrant over a Wikipedia-sourced corpus.",
      "Shadow evaluation harness — an LLM-as-judge scoring faithfulness and relevancy per strategy, off the serving path.",
      "Bayesian optimizer — Optuna tuning routing thresholds against an accuracy SLA.",
      "Redis cache — response caching in front of the dispatcher.",
      "Streamlit dashboard — operational view of routing decisions and cost.",
    ],
    implementation: [
      "Generated a synthetic, LLM-labeled query dataset spanning complexity levels, since no off-the-shelf labeled set existed.",
      "Fine-tuned DeBERTa-v3-base on that dataset to produce the routing signal.",
      "Implemented three retrieval strategies — naive, parent-document and HyDE — behind one interface so the dispatcher can swap between them freely.",
      "Built the ingestion pipeline over a Wikipedia-sourced corpus with chunking, embedding and Qdrant indexing.",
      "Ran the evaluation harness in shadow mode so judge scoring never added latency to live responses.",
      "Used Optuna to search routing thresholds against an accuracy SLA rather than tuning them by intuition.",
      "Added a Redis response cache and a Streamlit dashboard for routing and cost monitoring.",
    ],
    aiComponents: [
      "DeBERTa-v3-base complexity classifier, fine-tuned",
      "Synthetic LLM-labeled dataset generation",
      "Naive / parent-document / HyDE retrieval strategies",
      "Cost-tiered model routing",
      "LLM-as-judge faithfulness and relevancy scoring",
      "Bayesian threshold optimization (Optuna) against an accuracy SLA",
    ],
    challenges: [
      {
        challenge: "No labeled dataset exists for “how hard is this query”.",
        response:
          "Generated a synthetic dataset with LLM labeling, then fine-tuned DeBERTa-v3-base on it.",
      },
      {
        challenge:
          "Evaluating every strategy on every live request would make the gateway slower than the naive approach it replaces.",
        response:
          "Moved judge scoring into a shadow harness running off the serving path.",
      },
      {
        challenge:
          "Routing thresholds hand-tuned to one query mix silently degrade on another.",
        response:
          "Optuna Bayesian optimization against an explicit accuracy SLA, so the thresholds are fitted rather than guessed.",
      },
    ],
    results: [],
    future: [
      "Extend the tier set beyond three routing levels.",
      "Replace the Wikipedia corpus with a domain corpus to test transfer of the complexity signal.",
    ],
    repo: null,
    demo: null,
  },
  {
    slug: "tableau-powerbi-migration",
    name: "Tableau → Power BI Migration Agents",
    tagline:
      "LLM agents and custom XML parsers that converted enterprise Tableau dashboards into Power BI equivalents at 85–90% accuracy.",
    category: ["Agentic AI", "NLP"],
    origin: "BiHub Solutions (Innovative Office Solutions)",
    role: "AI Engineer Intern — built the agents, the .twb parsers and the FastAPI service layer.",
    period: "Feb 2025 — Apr 2025",
    status: "Delivered",
    featured: false,
    confidential: true,
    tech: [
      "LangGraph",
      "LangChain",
      "FastAPI",
      "Python",
      "Power BI",
      "DAX",
      "Power Query (M)",
      "XML",
    ],
    problem:
      "Migrating enterprise dashboards from Tableau to Power BI is slow, repetitive manual work — every chart, calculated field, filter and axis has to be rebuilt by hand in a different tool with a different query language.",
    why:
      "Dashboard migration effort scales linearly with dashboard count, and organizations moving BI platforms have hundreds of them. Most of the work is mechanical translation, which is exactly what parsing plus an LLM can absorb.",
    solution:
      "Parse the Tableau workbook format directly to recover dashboard structure, then use LLM agents to generate the equivalent DAX and Power Query (M) for Power BI, exposed through a FastAPI service.",
    architecture: [
      "Parser layer — custom parsers for Tableau (.twb) XML files extracting chart types, calculated fields, filters and axis configurations.",
      "Agent layer — LangGraph/LangChain agents mapping extracted structures to Power BI equivalents.",
      "Generation layer — LLM-driven DAX query and Power Query (M) script generation.",
      "Service layer — FastAPI endpoints exposing the chatbot and automation agents to the rest of the pipeline.",
    ],
    implementation: [
      "Wrote custom .twb XML parsers rather than relying on an LLM to read raw workbook files, so structural extraction stayed deterministic.",
      "Handed the parsed structures to LangGraph/LangChain agents for the parts that genuinely need judgment — expression translation.",
      "Generated DAX and Power Query (M) output targeted at Power BI's semantics rather than transliterating Tableau syntax.",
      "Built the FastAPI service layer so the migration agents were callable from the broader pipeline.",
    ],
    aiComponents: [
      "LangGraph/LangChain migration agents",
      "LLM-driven DAX generation",
      "LLM-driven Power Query (M) generation",
      "Conversational interface over the migration pipeline",
    ],
    challenges: [
      {
        challenge:
          "Tableau calculated fields and Power BI DAX express similar ideas with different semantics — a literal translation produces valid code with wrong results.",
        response:
          "Agent-driven translation targeting Power BI semantics, evaluated against project conversion criteria rather than syntactic similarity.",
      },
      {
        challenge:
          "Feeding whole .twb files to an LLM wastes context and produces inconsistent structural extraction.",
        response:
          "Deterministic XML parsers extracted structure first; the LLM only handled the expression-level translation.",
      },
    ],
    results: [
      { label: "Conversion accuracy", value: "85–90%" },
      { label: "Measured against", value: "Project evaluation criteria" },
    ],
    future: [],
    repo: null,
    demo: null,
  },
  {
    slug: "ai-engineer-workspace",
    name: "AI Engineer Portfolio & Personal AI Workspace",
    tagline:
      "This site — a portfolio with a Gemini-grounded assistant, plus a private task system that accepts work updates as plain-text messages from a phone.",
    category: ["Personal", "Agentic AI", "RAG"],
    origin: "Self-directed",
    role: "Sole author — architecture, frontend, backend, database and AI integration.",
    period: "2026 — Present",
    status: "In Progress",
    featured: false,
    confidential: false,
    tech: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Prisma",
      "NextAuth",
      "Google Gemini",
      "Telegram Bot API",
      "Vercel",
    ],
    problem:
      "A portfolio that only lists work goes stale the moment it ships, and the daily record of what was actually built lives scattered across notes, chats and memory.",
    why:
      "Two things worth solving at once: recruiters and clients need a grounded way to ask questions about the work, and the author needs a low-friction way to capture daily engineering work from a phone without opening a task app.",
    solution:
      "A public portfolio with a Gemini-backed assistant answering strictly from verified profile content, and a private dashboard whose tasks can be created by sending an ordinary message — an LLM extracts the structured task from free text.",
    architecture: [
      "Public site — Next.js App Router, statically rendered content pages driven by a typed content layer.",
      "Assistant — Gemini called server-side only, grounded in a curated portfolio knowledge base, with prompt-injection resistance and no access to private data.",
      "Private dashboard — credential auth, task management, work journal and analytics.",
      "Message ingestion — Telegram webhook → authorized-sender check → Gemini structured extraction → database.",
      "Private assistant — question answering over the task history, behind authentication.",
    ],
    implementation: [
      "Content layer holds verified profile facts in typed modules so the site and the assistant answer from the same source.",
      "All model calls run server-side; no API key ever reaches the browser.",
      "Public and private data paths are separated at the database and route level, so the public assistant cannot reach work records.",
    ],
    aiComponents: [
      "Grounded portfolio Q&A (Gemini)",
      "Voice interaction over the same assistant",
      "Structured task extraction from free-text messages",
      "Private assistant over personal work history",
    ],
    challenges: [
      {
        challenge:
          "A public chatbot with access to a person's real data will eventually be asked to reveal something private.",
        response:
          "The public assistant is grounded only in curated public content and has no route to the private database.",
      },
    ],
    results: [],
    future: [
      "Voice agent with speech-to-text and text-to-speech.",
      "Weekly work summaries generated from the task history.",
    ],
    repo: null,
    demo: null,
  },
];

export const projectCategories: ProjectCategory[] = [
  "Enterprise AI",
  "Agentic AI",
  "RAG",
  "AI Infrastructure",
  "NLP",
  "Personal",
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
