import { describe, expect, it } from "vitest";

import { buildGraphNarrative, getGraphView, scopeGraph } from "../lib/graph-overview";
import { concepts, connections } from "../lib/knowledge-data";

describe("graph overview", () => {
  it("provides stable collection views and scopes relationships correctly", () => {
    expect(getGraphView("strong-links").scope).toBe("strong");
    expect(getGraphView("missing-view").id).toBe("overview");
    const strong = scopeGraph(concepts, connections, "strong");
    expect(strong.connections.every((connection) => connection.strength >= 4)).toBe(true);
    expect(strong.concepts.every((concept) => strong.connections.some((connection) => connection.sourceId === concept.id || connection.targetId === concept.id))).toBe(true);
    expect(scopeGraph(concepts, connections, "noted").connections.every((connection) => Boolean(connection.note))).toBe(true);
  });

  it("explains the whole graph and recommends concrete next actions", () => {
    const narrative = buildGraphNarrative(concepts, connections);
    expect(narrative.headline).toContain("idea");
    expect(narrative.summary).toContain("Adaptive Systems");
    expect(narrative.structure).toContain("Relationship patterns");
    expect(narrative.featuredConnections.length).toBeGreaterThan(0);
    expect(narrative.actions.length).toBeGreaterThan(0);
  });

  it("gives a useful written starting path for an empty graph", () => {
    const narrative = buildGraphNarrative([], []);
    expect(narrative.headline).toContain("first idea");
    expect(narrative.actions).toHaveLength(3);
  });
});
