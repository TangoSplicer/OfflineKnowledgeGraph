import { describe, expect, it } from "vitest";

import { visibleGraphConnections } from "../lib/graph-relationships";
import { graphNodeLabel, isGraphLabelDensity, shouldShowGraphNodeLabel } from "../lib/graph-node-labels";
import { clampGraphCanvasScale, clampGraphCanvasTranslation, graphCanvasTranslationBounds, nextGraphCanvasViewportForKey } from "../lib/graph-canvas-navigation";
import { concepts, connections } from "../lib/knowledge-data";

describe("live graph canvas data", () => {
  it("renders every valid local relationship on the full Explore canvas", () => {
    expect(visibleGraphConnections(concepts, connections)).toHaveLength(connections.length);
  });

  it("keeps compact previews focused while retaining valid visible connections", () => {
    const compact = visibleGraphConnections(concepts, connections, true);
    expect(compact.every((connection) => connection.sourceId !== "donella-meadows" && connection.targetId !== "donella-meadows")).toBe(true);
    expect(compact.map((connection) => connection.id)).toContain("adaptive-feedback");
  });

  it("keeps a readable title on every graph node instead of reducing it to an initial", () => {
    expect(graphNodeLabel("A useful idea from my reading")).toBe("A useful idea from my reading");
    expect(graphNodeLabel("A very long relationship-centered research concept title", true)).toBe(
      "A very long relationship-…",
    );
  });

  it("offers deterministic label density reductions while preserving an accessible graph anchor", () => {
    expect(isGraphLabelDensity("balanced")).toBe(true);
    expect(isGraphLabelDensity("hidden")).toBe(false);
    expect(shouldShowGraphNodeLabel("all", 3, false)).toBe(true);
    expect(shouldShowGraphNodeLabel("balanced", 1, false)).toBe(false);
    expect(shouldShowGraphNodeLabel("balanced", 3, true)).toBe(true);
    expect(shouldShowGraphNodeLabel("minimal", 0, false)).toBe(true);
    expect(shouldShowGraphNodeLabel("minimal", 2, false)).toBe(false);
  });

  it("temporarily isolates the focused label without changing the saved density choice", () => {
    expect(shouldShowGraphNodeLabel("all", 0, false, true)).toBe(false);
    expect(shouldShowGraphNodeLabel("balanced", 1, true, true)).toBe(true);
    expect(shouldShowGraphNodeLabel("minimal", 0, false, false)).toBe(true);
  });

  it("keeps pinch zoom and pan within a predictable, resettable canvas viewport", () => {
    expect(clampGraphCanvasScale(0.4)).toBe(1);
    expect(clampGraphCanvasScale(5)).toBe(2.6);
    expect(graphCanvasTranslationBounds(2, 360, 330)).toEqual({ x: 180, y: 165 });
    expect(clampGraphCanvasTranslation({ x: 900, y: -900 }, 2, 360, 330)).toEqual({ x: 180, y: -165 });
    expect(clampGraphCanvasTranslation({ x: 40, y: -40 }, 1, 360, 330)).toEqual({ x: 0, y: 0 });
  });

  it("supports focused web keyboard navigation without allowing the viewport to leave the canvas bounds", () => {
    const zoomed = nextGraphCanvasViewportForKey("+", { scale: 1, translation: { x: 0, y: 0 } }, 360, 330);
    expect(zoomed).toEqual({ scale: 1.2, translation: { x: 0, y: 0 } });
    const panned = nextGraphCanvasViewportForKey("ArrowRight", zoomed!, 360, 330);
    expect(panned?.translation.x).toBeCloseTo(36, 8);
    expect(nextGraphCanvasViewportForKey("0", panned!, 360, 330)).toEqual({ scale: 1, translation: { x: 0, y: 0 } });
    expect(nextGraphCanvasViewportForKey("x", zoomed!, 360, 330)).toBeNull();
  });
});
