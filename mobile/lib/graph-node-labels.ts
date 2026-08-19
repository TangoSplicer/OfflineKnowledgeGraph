/**
 * Keeps node titles legible in a finite canvas without hiding their identity
 * behind an initial or a selection-only detail view.
 */
export function graphNodeLabel(title: string, compact = false): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  const maximum = compact ? 26 : 38;

  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}
