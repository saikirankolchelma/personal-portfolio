/**
 * AI Lab - interest and learning areas.
 *
 * `level` describes depth of engagement honestly:
 *   "applied"     - used in shipped professional work
 *   "hands-on"    - built with it in self-directed projects
 *   "exploring"   - actively learning, not yet shipped
 * Nothing here claims expertise that the resume does not support.
 */

export type InterestLevel = "applied" | "hands-on" | "exploring";

export type InterestArea = {
  id: string;
  title: string;
  blurb: string;
  level: InterestLevel;
  topics: string[];
  /** Slugs of projects where this area shows up in real work. */
  relatedProjects: string[];
};

export const levelMeta: Record<
  InterestLevel,
  { label: string; description: string }
> = {
  applied: {
    label: "Applied in production work",
    description: "Used in shipped professional or client work.",
  },
  "hands-on": {
    label: "Hands-on",
    description: "Built with it in self-directed projects.",
  },
  exploring: {
    label: "Exploring",
    description: "Actively learning. Not yet shipped.",
  },
};

export const interestAreas: InterestArea[] = [
  {
    id: "agent-optimization",
    title: "Agent Optimization",
    blurb:
      "Making multi-agent systems reliable enough to trust: how work gets delegated, what each agent remembers, and how you tell whether a change actually helped.",
    level: "applied",
    topics: [
      "Tool calling",
      "Agent planning",
      "Orchestrator / sub-agent design",
      "Short-term, long-term & episodic memory",
      "Context engineering",
      "Model routing",
      "Agent evaluation",
      "Reliability",
    ],
    relatedProjects: ["athena-agentic-platform", "agentic-data-structuring"],
  },
  {
    id: "rag",
    title: "RAG & Knowledge Systems",
    blurb:
      "Retrieval past the naive baseline - where chunk similarity stops being enough and the structure of the data has to be modeled directly.",
    level: "applied",
    topics: [
      "Metadata-aware chunking",
      "Hybrid search",
      "BM25",
      "Graph RAG",
      "Parent-document retrieval",
      "HyDE",
      "Reranking",
      "Retrieval evaluation",
    ],
    relatedProjects: ["clinical-knowledge-graph-rag", "meta-rag-gateway"],
  },
  {
    id: "ai-security",
    title: "AI Security & Guardrails",
    blurb:
      "What happens when someone tries to talk your agent out of its instructions - and what stands between a model and the data it should never repeat.",
    level: "applied",
    topics: [
      "Prompt injection",
      "Jailbreak resistance",
      "PII / PHI screening",
      "Input & output guardrails",
      "Secure tool calling",
      "Data privacy",
      "AI safety",
    ],
    relatedProjects: ["athena-agentic-platform"],
  },
  {
    id: "evaluation",
    title: "LLM Evaluation",
    blurb:
      "Turning “the output looks better” into a number you can regress against. Judge harnesses, labeled datasets, and shadow evaluation off the serving path.",
    level: "applied",
    topics: [
      "LLM-as-judge",
      "Labeled query/response datasets",
      "Faithfulness & relevancy scoring",
      "Shadow evaluation",
      "Bayesian threshold optimization",
      "Accuracy SLAs",
    ],
    relatedProjects: ["athena-agentic-platform", "meta-rag-gateway"],
  },
  {
    id: "knowledge-graphs",
    title: "Graph & Query Systems",
    blurb:
      "When relationships are the answer, not the metadata. Modeling domains as graphs and letting people ask in plain language.",
    level: "applied",
    topics: [
      "Neo4j",
      "AWS Neptune",
      "Cypher",
      "Gremlin",
      "Natural-language-to-Cypher",
      "Natural-language-to-SQL",
      "Schema introspection",
      "Topic modeling",
    ],
    relatedProjects: ["clinical-knowledge-graph-rag", "agentic-data-structuring"],
  },
  {
    id: "llm-training",
    title: "LLM Training & Fine-Tuning",
    blurb:
      "Fine-tuning smaller models for the jobs that do not need a frontier model - classification, routing, and structured extraction.",
    level: "hands-on",
    topics: [
      "Transformers",
      "Fine-tuning",
      "DeBERTa-v3",
      "Synthetic dataset generation",
      "SFT",
      "PEFT / QLoRA",
      "Quantization",
      "Model evaluation",
    ],
    relatedProjects: ["meta-rag-gateway"],
  },
  {
    id: "infrastructure",
    title: "AI Infrastructure & Cost",
    blurb:
      "The part nobody demos: what a system costs per query, where the latency goes, and how to route around both.",
    level: "hands-on",
    topics: [
      "Inference gateways",
      "Response caching",
      "Cost-tiered routing",
      "Latency optimization",
      "Docker",
      "MLflow",
      "Optuna",
      "AWS (EC2, S3, SageMaker, Bedrock)",
    ],
    relatedProjects: ["meta-rag-gateway", "athena-agentic-platform"],
  },
  {
    id: "core-ml",
    title: "Core ML, NLP & Vision",
    blurb:
      "The foundation underneath the LLM work - the classical modeling that still decides whether a pipeline is any good.",
    level: "applied",
    topics: [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "PyTorch",
      "Transformers",
      "Scikit-learn",
      "TensorFlow",
    ],
    relatedProjects: ["meta-rag-gateway", "agentic-data-structuring"],
  },
  {
    id: "multimodal",
    title: "Multimodal & Generative AI",
    blurb:
      "Systems that take in more than text. Currently a reading and prototyping area rather than shipped work.",
    level: "exploring",
    topics: [
      "Multimodal models",
      "Speech interfaces",
      "Vision-language models",
      "Generative AI patterns",
    ],
    relatedProjects: [],
  },
];
