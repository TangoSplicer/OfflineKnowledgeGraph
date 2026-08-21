export const GRAPH_CANVAS_MIN_SCALE = 1;
export const GRAPH_CANVAS_MAX_SCALE = 2.6;

export type GraphCanvasTranslation = { x: number; y: number };

export function clampGraphCanvasScale(value: number): number {
  "worklet";
  return Math.max(GRAPH_CANVAS_MIN_SCALE, Math.min(GRAPH_CANVAS_MAX_SCALE, value));
}

export function graphCanvasTranslationBounds(scale: number, width: number, height: number): GraphCanvasTranslation {
  "worklet";
  const boundedScale = clampGraphCanvasScale(scale);
  return {
    x: Math.max(0, (Math.max(0, width) * (boundedScale - 1)) / 2),
    y: Math.max(0, (Math.max(0, height) * (boundedScale - 1)) / 2),
  };
}

export function clampGraphCanvasTranslation(value: GraphCanvasTranslation, scale: number, width: number, height: number): GraphCanvasTranslation {
  "worklet";
  const bounds = graphCanvasTranslationBounds(scale, width, height);
  return {
    x: bounds.x === 0 ? 0 : Math.max(-bounds.x, Math.min(bounds.x, value.x)),
    y: bounds.y === 0 ? 0 : Math.max(-bounds.y, Math.min(bounds.y, value.y)),
  };
}
