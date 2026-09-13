/**
 * Freelancing offer.
 * Every service listed maps to something on the resume. Nothing is offered
 * that the experience does not support.
 */

export type Service = {
  id: string;
  title: string;
  description: string;
  /** What backs this up - kept honest, mapped to real work. */
  backedBy: string;
  deliverables: string[];
};

export const availability = {
  open: true,
  headline: "Open to selected freelance AI/ML projects",
  detail:
    "Currently working full-time as an AI/ML Engineer, and taking on a small number of freelance engagements alongside it - which means I am selective, and honest about timelines before we start.",
  capacity: "Part-time, limited engagements",
  responseTime: "Usually within 24 hours",
  workingWith: ["Startups", "Product teams", "Research groups", "Agencies"],
};

export const services: Service[] = [
  {
    id: "rag",
    title: "Custom RAG Systems",
    description:
      "Retrieval over your own documents, data or knowledge base - including the cases where naive chunk retrieval falls apart and the domain needs to be modeled as a graph.",
    backedBy:
      "Built and evaluated hybrid-search and Graph RAG pipelines over clinical trial, drug and disease data on client work.",
    deliverables: [
      "Ingestion & chunking pipeline",
      "Hybrid semantic + BM25 retrieval",
      "Graph RAG where relationships matter",
      "Retrieval evaluation harness",
    ],
  },
  {
    id: "agents",
    title: "AI Agents & Agentic Workflows",
    description:
      "Multi-agent systems that do real work against real tools - orchestrator/sub-agent architectures rather than one prompt asked to do everything.",
    backedBy:
      "Developed 10+ specialized LangGraph agents in an orchestrator/sub-agent architecture on enterprise client work.",
    deliverables: [
      "LangGraph / CrewAI orchestration",
      "Specialized sub-agents per concern",
      "Agent memory design",
      "Failure handling and retries",
    ],
  },
  {
    id: "mcp",
    title: "MCP Tool Servers & Integrations",
    description:
      "Standardized tool access for your agents, so adding the next integration does not mean inventing another bespoke protocol.",
    backedBy:
      "Designed MCP servers with SSE and stdio transports, including schema-introspection and query-execution tools.",
    deliverables: [
      "MCP servers (SSE and stdio)",
      "Tool schema design",
      "Database and API tool nodes",
      "Schema introspection for dynamic SQL",
    ],
  },
  {
    id: "chatbots",
    title: "LLM Chatbots & Assistants",
    description:
      "Assistants grounded in your content that answer from what you actually published, and say so when they do not know.",
    backedBy:
      "Built research-facing Q&A chatbots over retrieval layers, and conversational interfaces over automation pipelines.",
    deliverables: [
      "Grounded question answering",
      "Conversation memory",
      "Fallback and refusal behavior",
      "Web or API delivery",
    ],
  },
  {
    id: "nl2sql",
    title: "Natural Language to SQL / Query",
    description:
      "Let non-engineers ask your database questions in plain English, against the live schema rather than a stale snapshot.",
    backedBy:
      "Built natural-language-to-SQL workflows over introspected schemas, and NL-to-Cypher/Gremlin translation for graph databases.",
    deliverables: [
      "Schema introspection layer",
      "Query generation and validation",
      "Governance rules as agent context",
      "Result explanation",
    ],
  },
  {
    id: "guardrails",
    title: "Guardrails & AI Safety Review",
    description:
      "Input and output screening for systems that touch regulated or personal data - and a look at what your agent does when someone tries to talk it out of its instructions.",
    backedBy:
      "Implemented guardrails covering PII/PHI, jailbreaks, harm, social bias, profanity and prompt injection alongside IBM Guardrails.",
    deliverables: [
      "Input / output guardrail layer",
      "PII / PHI screening",
      "Prompt-injection resistance",
      "Policy-aligned refusal behavior",
    ],
  },
  {
    id: "evaluation",
    title: "LLM Evaluation Harnesses",
    description:
      "A way to tell whether your last prompt change helped or hurt, instead of arguing about sample outputs.",
    backedBy:
      "Built an LLM-as-judge evaluation harness scoring responses against a labeled dataset, and a shadow-evaluation harness with Bayesian threshold tuning.",
    deliverables: [
      "Labeled evaluation dataset",
      "LLM-as-judge scoring",
      "Faithfulness & relevancy metrics",
      "Regression tracking between iterations",
    ],
  },
  {
    id: "optimization",
    title: "Cost & Latency Optimization",
    description:
      "Routing, caching and model-tier decisions for systems where the inference bill has started to matter.",
    backedBy:
      "Built an adaptive routing gateway with a fine-tuned complexity classifier, cost-tiered dispatch, Redis caching and Optuna threshold optimization.",
    deliverables: [
      "Query complexity routing",
      "Cost-tiered model dispatch",
      "Response caching",
      "Cost and routing dashboard",
    ],
  },
];

export const projectTypes = [
  "RAG system",
  "AI agent / agentic workflow",
  "Chatbot or assistant",
  "MCP tool server",
  "Natural language to SQL",
  "Guardrails / AI safety",
  "LLM evaluation",
  "Cost / latency optimization",
  "ML or NLP model",
  "Consultation / architecture review",
  "Other",
] as const;

export const budgetRanges = [
  "Under $500",
  "$500 - $2,000",
  "$2,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000+",
  "Not sure yet",
] as const;

export const timelines = [
  "ASAP",
  "Within 2 weeks",
  "Within a month",
  "1 - 3 months",
  "Flexible",
] as const;

export const engagementSteps = [
  {
    step: "01",
    title: "Tell me what you are building",
    detail:
      "Send the problem, not the spec. What the system needs to do, who uses it, and what breaks today.",
  },
  {
    step: "02",
    title: "Scope call",
    detail:
      "A short call to pin down constraints, data access and what success actually looks like.",
  },
  {
    step: "03",
    title: "Proposal & timeline",
    detail:
      "A written scope with milestones and an honest timeline that accounts for my full-time commitments.",
  },
  {
    step: "04",
    title: "Build & iterate",
    detail:
      "Working increments you can see, with evaluation in place so quality is measured rather than asserted.",
  },
];
