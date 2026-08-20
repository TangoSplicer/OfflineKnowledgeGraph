/**
 * Keeps node titles legible in a finite canvas without hiding their identity
 * behind an initial or a selection-only detail view.
 */
export const graphLabelDensityOptions = [
  { id: "all", label: "All labels", detail: "Show every node title." },
  { id: "balanced", label: "Balanced", detail: "Reduce overlap while keeping a representative set of titles." },
  { id: "minimal", label: "Minimal", detail: "Show only the focused title, or one anchor when nothing is focused." },
] as const;

export type GraphLabelDensity = (typeof graphLabelDensityOptions)[number]["id"];

export function isGraphLabelDensity(value: unknown): value is GraphLabelDensity {
  return typeof value === "string" && graphLabelDensityOptions.some((option) => option.id === value);
}

export function shouldShowGraphNodeLabel(density: GraphLabelDensity, index: number, featured: boolean, focusedPreview = false): boolean {
  if (focusedPreview) return featured;
  if (density === "all") return true;
  if (density === "balanced") return featured || index % 2 === 0;
  return featured || index === 0;
}

export function graphNodeLabel(title: string, compact = false): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  const maximum = compact ? 26 : 38;

  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}
