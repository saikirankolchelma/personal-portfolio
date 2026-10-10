/**
 * Ambient neural constellation behind the hero.
 *
 * Nodes drift, the links between them breathe, and signals travel the longer
 * edges — the visual grammar of a network under load, without saying so.
 *
 * Three constraints shaped it:
 *  - It sits behind the headline, so opacity stays low enough that contrast is
 *    never in question. It should register peripherally, not compete.
 *  - Positions are a fixed table rather than Math.random, so the server and
 *    client render identical markup. Random layout here is a hydration
 *    mismatch waiting to happen.
 *  - Pure CSS transforms, so it runs on the compositor and costs nothing on
 *    the main thread while a visitor scrolls.
 */

type Point = { x: number; y: number; r: number };

/** Hand-placed to spread weight across the canvas without clustering. */
const NODES: Point[] = [
  { x: 60, y: 90, r: 2.5 },
  { x: 175, y: 200, r: 3.5 },
  { x: 120, y: 330, r: 2 },
  { x: 285, y: 70, r: 2 },
  { x: 320, y: 285, r: 4 },
  { x: 430, y: 165, r: 2.5 },
  { x: 500, y: 360, r: 2 },
  { x: 610, y: 95, r: 3 },
  { x: 660, y: 250, r: 2.5 },
  { x: 760, y: 390, r: 2 },
  { x: 845, y: 140, r: 3.5 },
  { x: 915, y: 300, r: 2.5 },
  { x: 1020, y: 200, r: 2 },
  { x: 1105, y: 355, r: 3 },
  { x: 1150, y: 110, r: 2.5 },
];

/** Links every pair closer than this, which yields a web rather than a mesh. */
const LINK_DISTANCE = 230;

const EDGES: [number, number][] = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const a = NODES[i]!;
    const b = NODES[j]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) < LINK_DISTANCE) EDGES.push([i, j]);
  }
}

/** The longest few edges carry signals; short hops would look like jitter. */
const SIGNAL_EDGES = [...EDGES]
  .sort((p, q) => {
    const d = (e: [number, number]) =>
      Math.hypot(NODES[e[0]]!.x - NODES[e[1]]!.x, NODES[e[0]]!.y - NODES[e[1]]!.y);
    return d(q) - d(p);
  })
  .slice(0, 6);

export function HeroConstellation() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 450"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-[0.55]"
      >
        {EDGES.map(([i, j], k) => {
          const a = NODES[i]!;
          const b = NODES[j]!;
          return (
            <line
              key={`e-${k}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--accent)"
              strokeWidth="0.7"
              className="constellation-link"
              style={{ animationDelay: `${(k % 7) * 0.9}s` }}
            />
          );
        })}

        {SIGNAL_EDGES.map(([i, j], k) => {
          const a = NODES[i]!;
          const b = NODES[j]!;
          return (
            <circle
              key={`s-${k}`}
              r="2"
              className="constellation-signal"
              style={
                {
                  "--x1": `${a.x}px`,
                  "--y1": `${a.y}px`,
                  "--x2": `${b.x}px`,
                  "--y2": `${b.y}px`,
                  animationDelay: `${k * 1.4}s`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {NODES.map((node, i) => (
          <circle
            key={`n-${i}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="var(--accent)"
            className="constellation-node"
            style={{
              transformOrigin: `${node.x}px ${node.y}px`,
              animationDelay: `${(i % 5) * 1.1}s`,
              animationDuration: `${7 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
