export function edgeStrokeWidth(strength: number, noted = false): number {
  const clamped = Math.max(1, Math.min(5, Math.round(strength)));
  return Number((1.1 + clamped * 0.62 + (noted ? 0.22 : 0)).toFixed(2));
}

export function edgeOpacity(strength: number, selected = false): number {
  if (selected) return 0.98;
  const clamped = Math.max(1, Math.min(5, Math.round(strength)));
  return Number((0.28 + clamped * 0.12).toFixed(2));
}

export function strengthLabel(strength: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(strength)));
  return `${clamped}/5 strength`;
}
