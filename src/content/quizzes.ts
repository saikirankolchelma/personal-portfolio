/**
 * Quiz banks.
 *
 * Every answer here is a well-established fact with a stated reason — the
 * explanation is the point, not the score. If a question could reasonably have
 * two defensible answers, it does not belong in this file.
 */

export type Question = {
  question: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
};

export type Quiz = {
  slug: string;
  title: string;
  blurb: string;
  questions: Question[];
};

const aiQuestions: Question[] = [
  {
    question: "In Retrieval-Augmented Generation, what does the retrieval step actually change?",
    options: [
      "The model's weights are updated with the retrieved documents",
      "Relevant context is added to the prompt before generation",
      "The model is fine-tuned on each query at runtime",
      "The tokenizer is swapped for a domain-specific one",
    ],
    answer: 1,
    explanation:
      "RAG is a prompting strategy, not a training one. Retrieved passages are inserted into the context window; the model's weights never change.",
  },
  {
    question: "What does BM25 rank documents by?",
    options: [
      "Cosine similarity between dense embeddings",
      "Term frequency and inverse document frequency, with length normalisation",
      "The order documents were indexed",
      "A neural cross-encoder score",
    ],
    answer: 1,
    explanation:
      "BM25 is a lexical scoring function built on TF-IDF ideas plus saturation and document-length normalisation. It matches exact terms, which is why it pairs well with dense retrieval in hybrid search.",
  },
  {
    question: "Why does LoRA make fine-tuning cheaper?",
    options: [
      "It trains small low-rank adapter matrices while the base weights stay frozen",
      "It reduces the training set to the most important examples",
      "It converts the model to 4-bit before training",
      "It skips backpropagation entirely",
    ],
    answer: 0,
    explanation:
      "LoRA injects trainable low-rank matrices into existing layers and freezes the original weights, so the number of trained parameters drops by orders of magnitude. Quantisation is a separate idea — combining the two is QLoRA.",
  },
  {
    question: "What is a prompt injection attack?",
    options: [
      "Overloading a model with very long prompts to exhaust its context",
      "Content the model reads being crafted to override its instructions",
      "Injecting SQL through a chat interface",
      "Sending malformed JSON to a model API",
    ],
    answer: 1,
    explanation:
      "The attack works because models do not inherently distinguish instructions from data. Text in a document, a web page, or a tool result can carry instructions the model then follows.",
  },
  {
    question: "In a transformer, what does the attention mechanism compute?",
    options: [
      "A fixed positional ordering of tokens",
      "Weighted relationships between tokens, letting each attend to others",
      "The gradient of the loss with respect to the input",
      "A compressed summary vector for the whole sequence",
    ],
    answer: 1,
    explanation:
      "Attention scores every token against every other via queries and keys, then mixes their values by those weights. That is how context reaches a token from anywhere in the sequence.",
  },
  {
    question: "What problem does HyDE (Hypothetical Document Embeddings) address?",
    options: [
      "Vector databases returning stale results",
      "Questions and answers being worded too differently to match by similarity",
      "Models exceeding their context window",
      "Embedding models being too slow to run at query time",
    ],
    answer: 1,
    explanation:
      "HyDE has the model draft a hypothetical answer first, then embeds that instead of the question. The draft looks more like the target document than the question does, so similarity search lands closer.",
  },
  {
    question: "What does 'LLM-as-a-judge' mean in evaluation?",
    options: [
      "Using a model to score another model's outputs against criteria",
      "Letting a model choose its own training data",
      "Having the model rate its confidence in each token",
      "A human panel reviewing model outputs",
    ],
    answer: 0,
    explanation:
      "A judge model scores outputs for qualities like faithfulness or relevance. It scales far past human review, though it inherits the judge's own biases — which is why it is paired with a labelled set.",
  },
  {
    question: "Why does a knowledge graph help where chunk-based RAG struggles?",
    options: [
      "Graphs store more text per node",
      "Relationships between entities are modelled explicitly rather than implied",
      "Graph queries are always faster than vector search",
      "Graphs do not require embeddings, so they cost nothing",
    ],
    answer: 1,
    explanation:
      "Chunking flattens many-to-many relationships — the answer lives between records, not inside one. A graph makes those edges first-class, turning a relationship question into a traversal.",
  },
  {
    question: "What is the Model Context Protocol (MCP) for?",
    options: [
      "Compressing prompts to fit smaller context windows",
      "A standard way for models to discover and call external tools and data",
      "A file format for storing model checkpoints",
      "A protocol for distributing training across GPUs",
    ],
    answer: 1,
    explanation:
      "MCP standardises the interface between a model and external capabilities, so adding a tool does not mean inventing a new integration pattern each time.",
  },
  {
    question: "What is the difference between temperature 0 and temperature 1?",
    options: [
      "Temperature 0 is faster; temperature 1 is more accurate",
      "Temperature 0 makes sampling near-deterministic; higher values increase randomness",
      "Temperature 0 disables the model's safety filters",
      "Temperature only affects how many tokens are generated",
    ],
    answer: 1,
    explanation:
      "Temperature rescales the logits before sampling. Near zero the highest-probability token almost always wins; higher values flatten the distribution and admit more variety.",
  },
];

const dsaQuestions: Question[] = [
  {
    question: "What is the average time complexity of a lookup in a hash table?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 0,
    explanation:
      "Hashing gives constant-time access on average. Worst case degrades to O(n) when every key collides into one bucket.",
  },
  {
    question: "Binary search requires which precondition?",
    options: [
      "The array must contain unique values",
      "The array must be sorted",
      "The array length must be a power of two",
      "The array must fit in cache",
    ],
    answer: 1,
    explanation:
      "Halving the search space only works if order tells you which half to discard. Without sorting, the discarded half may hold the target.",
  },
  {
    question: "Which traversal of a binary search tree yields values in sorted order?",
    options: ["Pre-order", "In-order", "Post-order", "Level-order"],
    answer: 1,
    explanation:
      "In-order visits left subtree, node, then right subtree. Given the BST invariant, that produces ascending order.",
  },
  {
    question: "What is the worst-case time complexity of quicksort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 2,
    explanation:
      "Consistently poor pivots — such as always picking the smallest element on sorted input — give partitions of size n-1, degrading to O(n²). Randomised or median-of-three pivots make it unlikely.",
  },
  {
    question: "Which data structure does breadth-first search use?",
    options: ["Stack", "Queue", "Priority queue", "Linked list"],
    answer: 1,
    explanation:
      "A FIFO queue visits nodes in order of distance from the source, which is exactly what exploring level by level requires. DFS uses a stack instead.",
  },
  {
    question: "What does dynamic programming fundamentally rely on?",
    options: [
      "Overlapping subproblems and optimal substructure",
      "Randomised sampling of the search space",
      "The input being sorted in advance",
      "Parallel execution across cores",
    ],
    answer: 0,
    explanation:
      "Subproblems must recur (so caching pays off) and an optimal solution must be constructible from optimal subsolutions. Without both, memoisation does not help.",
  },
  {
    question: "Why can Dijkstra's algorithm fail on graphs with negative edge weights?",
    options: [
      "It cannot represent negative numbers",
      "It finalises a node's distance on first visit, which a later negative edge could improve",
      "It requires the graph to be undirected",
      "It runs out of memory on negative cycles",
    ],
    answer: 1,
    explanation:
      "Dijkstra's correctness rests on the assumption that extending a path never shortens it. A negative edge breaks that, so a node settled early may still have a cheaper route. Bellman-Ford handles it.",
  },
  {
    question: "What is the space complexity of merge sort on an array?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 2,
    explanation:
      "The merge step needs an auxiliary buffer proportional to the input. That extra O(n) is what makes it lose to quicksort in memory-constrained settings despite the better worst case.",
  },
  {
    question: "A min-heap guarantees which property?",
    options: [
      "The array is fully sorted ascending",
      "Every parent is less than or equal to its children",
      "All leaves are at the same depth",
      "Lookup of an arbitrary value is O(log n)",
    ],
    answer: 1,
    explanation:
      "Only the parent-child relation is constrained, which is why the minimum is at the root in O(1) but finding an arbitrary element still takes O(n).",
  },
  {
    question: "What does the two-pointer technique typically optimise?",
    options: [
      "Converting O(n²) nested loops into a single O(n) pass",
      "Reducing memory from O(n) to O(1) in all cases",
      "Making recursion iterative",
      "Improving cache locality on linked lists",
    ],
    answer: 0,
    explanation:
      "On sorted or otherwise structured input, two indices moving under a rule cover in one pass what a nested loop would take quadratic time to check.",
  },
];

export const quizzes: Record<string, Quiz> = {
  "ai-quiz": {
    slug: "ai-quiz",
    title: "AI & ML Quiz",
    blurb:
      "Ten questions on LLMs, retrieval, fine-tuning and agent safety. Every answer comes with the reasoning.",
    questions: aiQuestions,
  },
  "dsa-quiz": {
    slug: "dsa-quiz",
    title: "DSA Quiz",
    blurb:
      "Ten questions on complexity, trees, graphs and the classic algorithms — the interview staples.",
    questions: dsaQuestions,
  },
};

export function getQuiz(slug: string): Quiz | undefined {
  return quizzes[slug];
}
