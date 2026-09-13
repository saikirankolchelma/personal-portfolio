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
    id: "genai",
    label: "Generative AI",
    note: "Agent orchestration, retrieval, and evaluation.",
    items: [
      "LangGraph",
      "LangChain",
      "CrewAI",
      "MCP",
      "Multi-Agent Orchestration",
      "RAG",
      "Graph RAG",
      "LLM Evaluation",
      "Guardrails",
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
