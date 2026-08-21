import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { focusNeighborhood, focusedNeighborhoodFitPreset } from "../lib/focus-neighborhood";

describe("multi-hop focus neighborhoods", () => {
  it("includes the selected concept and its immediate local connections", () => {
    const neighborhood = focusNeighborhood(concepts, connections, "adaptive-systems", 1);
    expect(neighborhood.conceptIds.has("adaptive-systems")).toBe(true);
    expect(neighborhood.conceptIds.has("feedback-loops")).toBe(true);
    expect(neighborhood.connections.every((connection) => neighborhood.conceptIds.has(connection.sourceId) && neighborhood.conceptIds.has(connection.targetId))).toBe(true);
  });

  it("expands through additional hops and rejects unknown focal concepts", () => {
    expect(focusNeighborhood(concepts, connections, "adaptive-systems", 2).concepts.length).toBeGreaterThanOrEqual(focusNeighborhood(concepts, connections, "adaptive-systems", 1).concepts.length);
    expect(focusNeighborhood(concepts, connections, "missing", 1).concepts).toEqual([]);
  });

  it("uses a radial one-hop preset when fitting a focused neighborhood to the canvas", () => {
    expect(focusedNeighborhoodFitPreset()).toEqual({ layout: "radial", hops: 1, focusedLabelPreview: false });
  });
});
