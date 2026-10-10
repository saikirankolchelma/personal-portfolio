export type SkillGroup = {
  id: string;
  label: string;
  /** Short line explaining where this group shows up in the work. */
  note: string;
  items: string[];
};

/** Groups and items mirror the resume's TECHNICAL SKILLS section verbatim. */
export const skillGroups: SkillGroup[] = [
  {
    id: "languages",
    label: "Languages",
    note: "Primary day-to-day tooling.",
    items: ["Python", "SQL"],
  },
  {
    id: "agentic",
    label: "Agentic AI",
    note: "Designing agents that hold up against real tools and real failure.",
    items: [
      "Multi-Agent Orchestration",
      "Orchestrator / Sub-Agent Architecture",
      "Deep Agents",
      "Context Engineering",
      "Loop Engineering",
      "Agent Planning",
      "Tool Calling",
      "MCP Tool Servers",
      "Short-Term / Long-Term / Episodic Memory",
      "State Management",
      "Agent Evaluation",
      "LLM-as-Judge",
      "Guardrails",
      "Prompt Injection Defence",
      "Failure Handling & Retries",
      "Human-in-the-Loop",
    ],
  },
  {
    id: "genai",
    label: "Generative AI",
    note: "The frameworks and retrieval patterns underneath the agents.",
    items: [
      "LangGraph",
      "LangChain",
      "CrewAI",
      "MCP",
      "RAG",
      "Graph RAG",
      "LLM Evaluation",
      "Prompt Engineering",
    ],
  },
  {
    id: "ml",
    label: "Machine Learning",
    note: "Model training, fine-tuning, and classical ML.",
    items: [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "LLM Fine-Tuning",
      "PyTorch",
      "Transformers",
      "Scikit-learn",
      "TensorFlow",
    ],
  },
  {
    id: "data",
    label: "Data & Retrieval",
    note: "Graph and vector stores behind the retrieval layers.",
    items: [
      "Neo4j",
      "AWS Neptune",
      "Cypher",
      "Gremlin",
      "PostgreSQL",
      "MySQL",
      "Qdrant",
      "FAISS",
      "Pinecone",
      "BM25",
      "Hybrid Search",
    ],
  },
  {
    id: "backend",
    label: "Backend & Cloud",
    note: "Service layers, deployment, and experiment tracking.",
    items: [
      "FastAPI",
      "Docker",
      "AWS (EC2, S3, SageMaker, Bedrock)",
      "Git",
      "Redis",
      "MLflow",
      "Optuna",
    ],
  },
  {
    id: "bi",
    label: "Data & BI",
    note: "Analysis, dashboards, and internal tooling.",
    items: ["NumPy", "Pandas", "Matplotlib", "Power BI", "Streamlit"],
  },
];

/** Compact set used for the homepage marquee. */
export const marqueeSkills = [
  "LangGraph", "LangChain", "CrewAI", "MCP", "Graph RAG", "Neo4j", "Qdrant",
  "FastAPI", "PyTorch", "Transformers", "AWS Bedrock", "Docker", "Optuna",
  "Hybrid Search", "BM25", "LLM Evaluation", "Guardrails", "Python",
];
