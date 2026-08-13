import { describe, expect, it } from "vitest";

import { visibleGraphConnections } from "../lib/graph-relationships";
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
});
