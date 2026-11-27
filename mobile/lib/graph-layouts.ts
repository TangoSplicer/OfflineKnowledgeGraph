import type { Concept, Connection } from "./knowledge-data";

export type GraphLayout = "balanced" | "radial" | "grid";
export type GraphPosition = { x: number; y: number };

export const graphLayouts: { id: GraphLayout; label: string; detail: string }[] = [
  { id: "balanced", label: "Balanced", detail: "Spreads concepts with a force-directed layout, so connected ideas sit near each other." },
  { id: "radial", label: "Radial", detail: "Spreads every concept around the center, in one ring for small graphs and two rings for larger ones." },
  { id: "grid", label: "Grid", detail: "Arranges dense graphs in clear rows, with spacing that adapts to graph size." },
];

/** Canvas area nodes are allowed to occupy, keeping labels inside the view. */
const BOUNDS = { minX: 0.1, maxX: 0.9, minY: 0.12, maxY: 0.88 };

const clampPosition = (position: GraphPosition): GraphPosition => ({
  x: Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, position.x)),
  y: Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, position.y)),
});

/** Deterministic per-id offset in [0, 1): no Math.random, so layouts are stable across renders. */
const hashSeed = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) / 4294967295;
};

const GOLDEN_ANGLE = 2.39996322972865332;

/** Golden-angle spiral: spreads any number of nodes without overlap-prone modular scatter. */
const spiralPosition = (index: number, total: number, id: string): GraphPosition => {
  if (total <= 1) return { x: 0.5, y: 0.5 };
  const angle = index * GOLDEN_ANGLE + hashSeed(id) * 0.9;
  const radius = 0.34 * Math.sqrt((index + 0.5) / total);
  return clampPosition({ x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius * 0.92 });
};

const radialPosition = (index: number, total: number, id: string): GraphPosition => {
  if (total <= 1) return { x: 0.5, y: 0.5 };
  // Two rings once a single ring would crowd nodes together.
  const outerCount = total > 14 ? Math.ceil(total / 2) : total;
  const outer = index < outerCount;
  const ringIndex = outer ? index : index - outerCount;
  const ringTotal = outer ? outerCount : total - outerCount;
  const radius = outer ? 0.36 : 0.19;
  const angle = -Math.PI / 2 + (ringIndex / Math.max(ringTotal, 1)) * Math.PI * 2 + (outer ? 0 : Math.PI / Math.max(ringTotal, 1)) + hashSeed(id) * 0.05;
  return clampPosition({ x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius * 0.92 });
};

const gridPosition = (index: number, total: number): GraphPosition => {
  if (total <= 1) return { x: 0.5, y: 0.5 };
  const columns = Math.min(Math.ceil(Math.sqrt(total)), 6);
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: columns === 1 ? 0.5 : 0.14 + (column / (columns - 1)) * 0.72,
    y: rows === 1 ? 0.5 : 0.16 + (row / (rows - 1)) * 0.68,
  };
};

/**
 * Positions for a whole graph. "balanced" starts from the spiral and then runs a
 * small deterministic force-directed relaxation: connected nodes attract, all
 * nodes repel, so real graphs spread out instead of colliding. Iteration count
 * is capped and large graphs (>120 nodes) keep the spiral only, keeping the
 * layout cheap with no new dependencies.
 */
export function graphPositionsFor(
  concepts: Pick<Concept, "id">[],
  connections: Pick<Connection, "sourceId" | "targetId">[],
  layout: GraphLayout,
): Map<string, GraphPosition> {
  const positions = new Map<string, GraphPosition>();
  const total = concepts.length;
  concepts.forEach((concept, index) => {
    positions.set(
      concept.id,
      layout === "balanced" ? spiralPosition(index, total, concept.id) : layout === "radial" ? radialPosition(index, total, concept.id) : gridPosition(index, total),
    );
  });
  if (layout !== "balanced" || total <= 1 || total > 120) return positions;

  const indexById = new Map(concepts.map((concept, index) => [concept.id, index]));
  const points = concepts.map((concept) => ({ ...positions.get(concept.id)! }));
  const edges = connections
    .map((connection) => [indexById.get(connection.sourceId), indexById.get(connection.targetId)] as const)
    .filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined && pair[0] !== pair[1]);
  const iterations = total <= 30 ? 80 : 40;
  const restLength = Math.max(0.16, 0.34 - total * 0.0015);
  for (let step = 0; step < iterations; step += 1) {
    const cooling = 1 - step / iterations;
    const forces = points.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < total; i += 1) {
      for (let j = i + 1; j < total; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = (points[i].y - points[j].y) * 1.1;
        const distanceSq = Math.max(dx * dx + dy * dy, 0.0004);
        const distance = Math.sqrt(distanceSq);
        const push = Math.min((0.0016 / distanceSq) * cooling, 0.02);
        forces[i].x += (dx / distance) * push;
        forces[i].y += (dy / distance) * push;
        forces[j].x -= (dx / distance) * push;
        forces[j].y -= (dy / distance) * push;
      }
    }
    edges.forEach(([a, b]) => {
      const dx = points[b].x - points[a].x;
      const dy = points[b].y - points[a].y;
      const distance = Math.max(Math.hypot(dx, dy), 0.001);
      const pull = ((distance - restLength) / distance) * 0.045 * cooling;
      forces[a].x += dx * pull;
      forces[a].y += dy * pull;
      forces[b].x -= dx * pull;
      forces[b].y -= dy * pull;
    });
    points.forEach((point, index) => {
      point.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, point.x + forces[index].x));
      point.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, point.y + forces[index].y));
    });
  }
  points.forEach((point, index) => positions.set(concepts[index].id, clampPosition(point)));
  return positions;
}

/**
 * Single-node position, kept for callers that position one node at a time.
 * Uses the same collision-aware spiral/ring/grid as the whole-graph layout,
 * never a hardcoded table for specific concept ids.
 */
export function graphPositionFor(id: string, index: number, total: number, layout: GraphLayout): GraphPosition {
  if (layout === "balanced") return spiralPosition(index, total, id);
  if (total <= 1) return { x: 0.5, y: 0.5 };
  if (layout === "radial") return radialPosition(index, total, id);
  return gridPosition(index, total);
}
