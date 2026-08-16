export type GraphLayout = "balanced" | "radial" | "grid";
export type GraphPosition = { x: number; y: number };

export const graphLayouts: { id: GraphLayout; label: string; detail: string }[] = [
  { id: "balanced", label: "Balanced", detail: "Uses stable positions for familiar paths." },
  { id: "radial", label: "Radial", detail: "Spreads every concept around the center." },
  { id: "grid", label: "Grid", detail: "Arranges dense graphs in clear rows." },
];

const BALANCED_POSITIONS: Record<string, GraphPosition> = {
  "adaptive-systems": { x: 0.5, y: 0.52 }, "feedback-loops": { x: 0.78, y: 0.27 }, "cognitive-load": { x: 0.2, y: 0.7 }, "boundary-conditions": { x: 0.74, y: 0.76 }, "donella-meadows": { x: 0.17, y: 0.24 },
};

const fallbackBalancedPosition = (index: number): GraphPosition => ({ x: 0.18 + ((index * 0.23) % 0.64), y: 0.23 + ((index * 0.31) % 0.54) });

export function graphPositionFor(id: string, index: number, total: number, layout: GraphLayout): GraphPosition {
  if (layout === "balanced") return BALANCED_POSITIONS[id] ?? fallbackBalancedPosition(index);
  if (total <= 1) return { x: 0.5, y: 0.5 };
  if (layout === "radial") {
    const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
    return { x: 0.5 + Math.cos(angle) * 0.33, y: 0.5 + Math.sin(angle) * 0.3 };
  }
  const columns = Math.min(3, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { x: columns === 1 ? 0.5 : 0.16 + (column / (columns - 1)) * 0.68, y: rows === 1 ? 0.5 : 0.22 + (row / (rows - 1)) * 0.56 };
}
