import { describe, expect, it } from "vitest";

import { visibleGraphConnections } from "../lib/graph-relationships";
import { graphNodeLabel, isGraphLabelDensity, shouldShowGraphNodeLabel } from "../lib/graph-node-labels";
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
});
