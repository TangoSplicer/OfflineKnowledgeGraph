import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { bridgeConcepts, compareConcepts, discoverPath } from "../lib/graph-paths";

describe("local graph paths", () => {
  it("finds a shortest undirected graph path", () => {
    const path = discoverPath(concepts, connections, "adaptive-systems", "feedback-loops");
    expect(path?.conceptIds.at(0)).toBe("adaptive-systems");
    expect(path?.conceptIds.at(-1)).toBe("feedback-loops");
    expect(discoverPath(concepts, connections, "adaptive-systems", "leverage-points")).toBeNull();
  });

  it("compares context and identifies bridge concepts", () => {
    const comparison = compareConcepts(concepts[0], concepts[1], connections);
    expect(comparison.combinedLinks).toBeGreaterThan(0);
    expect(bridgeConcepts(concepts, connections, 2)).toHaveLength(2);
  });
});
