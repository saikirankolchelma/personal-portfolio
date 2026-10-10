"use client";

import { useId } from "react";

/**
 * An animated orchestrator/sub-agent architecture.
 *
 * This is the shape the project pages describe, drawn: a query passes input
 * guardrails, reaches an orchestrator backed by layered memory, fans out to
 * specialised sub-agents, each of which reaches a tool, and results are scored
 * by a judge before returning. Decorative animation on a portfolio is noise —
 * this earns its place by being what the work actually is.
 *
 * Inline SVG with CSS keyframes rather than canvas or a rAF loop: nothing runs
 * on the main thread, it scales to any width, and it costs no JavaScript
 * beyond the single render.
 */

type Kind = "entry" | "guard" | "core" | "memory" | "agent" | "tool" | "judge";

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: Kind;
};

const NODES: Node[] = [
  { id: "query", label: "Query", x: 48, y: 170, kind: "entry" },
  { id: "gin", label: "Guardrails", x: 150, y: 170, kind: "guard" },
  { id: "orch", label: "Orchestrator", x: 282, y: 170, kind: "core" },
  { id: "mem", label: "Memory", x: 282, y: 58, kind: "memory" },

  { id: "a1", label: "Sentiment", x: 460, y: 80, kind: "agent" },
  { id: "a2", label: "Entities", x: 460, y: 170, kind: "agent" },
  { id: "a3", label: "Clustering", x: 460, y: 260, kind: "agent" },

  { id: "t1", label: "MCP tools", x: 638, y: 118, kind: "tool" },
  { id: "t2", label: "Graph DB", x: 638, y: 222, kind: "tool" },

  { id: "judge", label: "Judge", x: 772, y: 170, kind: "judge" },
  { id: "out", label: "Answer", x: 872, y: 170, kind: "entry" },
];

const EDGES: [string, string][] = [
  ["query", "gin"],
  ["gin", "orch"],
  ["orch", "mem"],
  ["orch", "a1"],
  ["orch", "a2"],
  ["orch", "a3"],
  ["a1", "t1"],
  ["a2", "t1"],
  ["a2", "t2"],
  ["a3", "t2"],
  ["t1", "judge"],
  ["t2", "judge"],
  ["judge", "out"],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

const RADIUS: Record<Kind, number> = {
  entry: 8,
  guard: 12,
  core: 19,
  memory: 12,
  agent: 13,
  tool: 13,
  judge: 13,
};

const FILL: Record<Kind, string> = {
  entry: "var(--accent-2)",
  guard: "var(--surface-2)",
  core: "",
  memory: "var(--surface-2)",
  agent: "var(--surface-2)",
  tool: "var(--surface-2)",
  judge: "var(--surface-2)",
};

const STROKE: Record<Kind, string> = {
  entry: "transparent",
  guard: "var(--danger)",
  core: "transparent",
  memory: "var(--accent-2)",
  agent: "var(--accent)",
  tool: "var(--accent-2)",
  judge: "var(--warning)",
};

export function AgentGraph() {
  // Gradient ids must stay unique if this ever renders twice on a page.
  const uid = useId().replace(/:/g, "");

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg opacity-60"
      />

      <svg
        viewBox="0 0 920 330"
        className="relative w-full"
        role="img"
        aria-label="Architecture diagram: a query passes input guardrails to an orchestrator backed by layered memory, which fans out to sentiment, entity and clustering sub-agents. Each reaches an MCP tool server or a graph database, and results are scored by a judge before returning as an answer."
      >
        <defs>
          {/*
            userSpaceOnUse, not the default objectBoundingBox. A perfectly
            horizontal line has a zero-height bounding box, which makes an
            objectBoundingBox gradient degenerate — the line silently vanishes.
            Spanning the viewBox also gives every edge the same left-to-right
            flow rather than restarting per segment.
          */}
          <linearGradient
            id={`edge-${uid}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="920"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.5" />
          </linearGradient>

          <radialGradient id={`core-${uid}`}>
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </radialGradient>
        </defs>

        {/* ------------------------------------------- sub-agent grouping */}
        <g>
          <rect
            x="394"
            y="36"
            width="132"
            height="268"
            rx="16"
            fill="var(--accent)"
            fillOpacity="0.04"
            stroke="var(--accent)"
            strokeOpacity="0.22"
            strokeDasharray="4 6"
          />
          <text
            x="460"
            y="26"
            textAnchor="middle"
            className="fill-[var(--accent)] font-mono text-[10px] uppercase tracking-[0.16em]"
          >
            Sub-agents
          </text>
          <text
            x="460"
            y="322"
            textAnchor="middle"
            className="fill-[var(--fg-subtle)] font-mono text-[9px]"
          >
            100+ specialised · one job each
          </text>
        </g>

        {/* --------------------------------------------------- tool group */}
        <text
          x="638"
          y="26"
          textAnchor="middle"
          className="fill-[var(--accent-2)] font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          Tools
        </text>

        {/* -------------------------------------------------------- edges */}
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
              r="3.5"
              className="agent-packet"
              style={
                {
                  "--x1": `${a.x}px`,
                  "--y1": `${a.y}px`,
                  "--x2": `${b.x}px`,
                  "--y2": `${b.y}px`,
                  // Staggered by depth so packets move through the graph as a
                  // wave instead of every edge firing at once.
                  animationDelay: `${(i % 6) * 0.5}s`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {/* -------------------------------------------------------- nodes */}
        {NODES.map((node, i) => (
          <g key={node.id}>
            {node.kind === "core" ? (
              <circle
                cx={node.x}
                cy={node.y}
                r={RADIUS.core + 9}
                fill="none"
                stroke="var(--accent)"
                strokeOpacity="0.3"
                strokeDasharray="3 5"
                className="agent-ring"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
            ) : null}

            <circle
              cx={node.x}
              cy={node.y}
              r={RADIUS[node.kind]}
              fill={node.kind === "core" ? `url(#core-${uid})` : FILL[node.kind]}
              stroke={STROKE[node.kind]}
              strokeOpacity="0.65"
              strokeWidth="1.5"
              className={
                node.kind === "agent" || node.kind === "tool"
                  ? "agent-node"
                  : undefined
              }
              style={{ animationDelay: `${i * 0.35}s` }}
            />

            <text
              x={node.x}
              y={
                // Memory sits above the orchestrator, so its label goes above
                // too rather than colliding with the edge between them.
                node.id === "mem"
                  ? node.y - RADIUS[node.kind] - 8
                  : node.y + RADIUS[node.kind] + 15
              }
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
