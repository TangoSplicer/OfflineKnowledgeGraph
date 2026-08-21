export const GRAPH_CANVAS_MIN_SCALE = 1;
export const GRAPH_CANVAS_MAX_SCALE = 2.6;
export const GRAPH_CANVAS_KEYBOARD_PAN_STEP = 36;
export const GRAPH_CANVAS_KEYBOARD_ZOOM_STEP = 0.2;

export type GraphCanvasTranslation = { x: number; y: number };
export type GraphCanvasViewport = { scale: number; translation: GraphCanvasTranslation };

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

export function nextGraphCanvasViewportForKey(key: string, viewport: GraphCanvasViewport, width: number, height: number): GraphCanvasViewport | null {
  const normalizedKey = key.toLowerCase();
  const nextScale = normalizedKey === "+" || normalizedKey === "=" ? clampGraphCanvasScale(viewport.scale + GRAPH_CANVAS_KEYBOARD_ZOOM_STEP) : normalizedKey === "-" || normalizedKey === "_" ? clampGraphCanvasScale(viewport.scale - GRAPH_CANVAS_KEYBOARD_ZOOM_STEP) : normalizedKey === "0" ? GRAPH_CANVAS_MIN_SCALE : viewport.scale;
  const movement = normalizedKey === "arrowleft" ? { x: -GRAPH_CANVAS_KEYBOARD_PAN_STEP, y: 0 } : normalizedKey === "arrowright" ? { x: GRAPH_CANVAS_KEYBOARD_PAN_STEP, y: 0 } : normalizedKey === "arrowup" ? { x: 0, y: -GRAPH_CANVAS_KEYBOARD_PAN_STEP } : normalizedKey === "arrowdown" ? { x: 0, y: GRAPH_CANVAS_KEYBOARD_PAN_STEP } : null;
  const recognized = movement !== null || nextScale !== viewport.scale || normalizedKey === "0";
  if (!recognized) return null;
  const requestedTranslation = normalizedKey === "0" ? { x: 0, y: 0 } : { x: viewport.translation.x + (movement?.x ?? 0), y: viewport.translation.y + (movement?.y ?? 0) };
  return { scale: nextScale, translation: clampGraphCanvasTranslation(requestedTranslation, nextScale, width, height) };
}
