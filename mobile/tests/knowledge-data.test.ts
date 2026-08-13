import { describe, expect, it } from "vitest";

import { concepts, findConcept, graphCollections, relatedTo } from "../lib/knowledge-data";

describe("knowledge graph local data", () => {
  it("exposes a non-empty offline graph collection", () => {
    expect(graphCollections.length).toBeGreaterThan(0);
    expect(graphCollections[0]).toMatchObject({ id: "systems-practice", nodeCount: 128 });
  });

  it("returns the requested concept and falls back safely for an unknown identifier", () => {
    expect(findConcept("feedback-loops").title).toBe("Feedback Loops");
    expect(findConcept("missing-concept").id).toBe(concepts[0].id);
  });

  it("never includes the selected concept in its related concept list", () => {
    const current = findConcept("adaptive-systems");
    expect(relatedTo(current.id)).not.toContainEqual(current);
    expect(relatedTo(current.id).length).toBeGreaterThan(0);
  });
});
