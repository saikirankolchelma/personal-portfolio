"use client";

import { useId } from "react";

/**
 * An animated orchestrator/sub-agent graph.
 *
 * This is the architecture described on the projects pages, drawn: a request
 * arrives, an orchestrator fans it out to specialised sub-agents, each reaches
 * a tool, and results return. Decorative animation on a portfolio is noise —
 * this earns its place by being the thing the work is actually about.
 *
 * Built as inline SVG with CSS keyframes rather than canvas or a rAF loop:
 * nothing runs on the main thread, it scales to any width, and it costs no
 * JavaScript beyond rendering once.
 */

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "entry" | "core" | "agent" | "tool";
};

const NODES: Node[] = [
  { id: "in", label: "Query", x: 40, y: 130, kind: "entry" },
  { id: "orch", label: "Orchestrator", x: 190, y: 130, kind: "core" },

  { id: "a1", label: "Sentiment", x: 370, y: 45, kind: "agent" },
  { id: "a2", label: "Entities", x: 370, y: 130, kind: "agent" },
  { id: "a3", label: "Clustering", x: 370, y: 215, kind: "agent" },

  { id: "t1", label: "MCP tools", x: 545, y: 87, kind: "tool" },
  { id: "t2", label: "Graph DB", x: 545, y: 173, kind: "tool" },

  { id: "out", label: "Answer", x: 690, y: 130, kind: "entry" },
];

const EDGES: [string, string][] = [
  ["in", "orch"],
  ["orch", "a1"],
  ["orch", "a2"],
  ["orch", "a3"],
  ["a1", "t1"],
  ["a2", "t1"],
  ["a2", "t2"],
  ["a3", "t2"],
  ["t1", "out"],
  ["t2", "out"],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

const RADIUS: Record<Node["kind"], number> = {
  entry: 7,
  core: 16,
  agent: 11,
  tool: 11,
};

export function AgentGraph() {
  // Gradient ids must be unique if the component ever renders twice.
  const uid = useId().replace(/:/g, "");

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg opacity-60"
      />

      <svg
        viewBox="0 0 730 260"
        className="relative w-full"
        role="img"
        aria-label="Animated diagram: a query reaches an orchestrator, which fans out to sentiment, entity and clustering sub-agents, each calling MCP tools or a graph database before results return as an answer."
      >
        <defs>
          <linearGradient id={`edge-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id={`core-${uid}`}>
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </radialGradient>
        </defs>

        {/* ------------------------------------------------------- edges */}
        {EDGES.map(([from, to]) => {
          const a = byId[from]!;
          const b = byId[to]!;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={`url(#edge-${uid})`}
              strokeWidth="1.5"
            />
          );
        })}

        {/* ------------------------------------------- travelling packets */}
        {EDGES.map(([from, to], i) => {
          const a = byId[from]!;
          const b = byId[to]!;
          return (
            <circle
              key={`p-${from}-${to}`}
              r="3"
              className="agent-packet"
              style={
                {
                  "--x1": `${a.x}px`,
                  "--y1": `${a.y}px`,
                  "--x2": `${b.x}px`,
                  "--y2": `${b.y}px`,
                  // Staggered so packets flow through the graph in waves
                  // rather than all firing at once.
                  animationDelay: `${(i % 5) * 0.55}s`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {/* ------------------------------------------------------- nodes */}
        {NODES.map((node, i) => (
          <g key={node.id}>
            {node.kind === "core" ? (
              <circle
                cx={node.x}
                cy={node.y}
                r={RADIUS.core + 8}
                fill="none"
                stroke="var(--accent)"
                strokeOpacity="0.25"
                strokeDasharray="3 5"
                className="agent-ring"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
            ) : null}

            <circle
              cx={node.x}
              cy={node.y}
              r={RADIUS[node.kind]}
              fill={
                node.kind === "core"
                  ? `url(#core-${uid})`
                  : node.kind === "entry"
                    ? "var(--accent-2)"
                    : "var(--surface-2)"
              }
              stroke={node.kind === "core" ? "none" : "var(--accent)"}
              strokeOpacity={node.kind === "entry" ? 0 : 0.5}
              strokeWidth="1.5"
              className={node.kind === "agent" || node.kind === "tool" ? "agent-node" : undefined}
              style={{ animationDelay: `${i * 0.4}s` }}
            />

            <text
              x={node.x}
              y={node.y + RADIUS[node.kind] + 15}
              textAnchor="middle"
              className="fill-[var(--fg-subtle)] font-mono text-[10px]"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
