import { describe, expect, it } from "vitest";

import { concepts, findConcept, graphCollections, relatedTo, updateConceptRecord } from "../lib/knowledge-data";

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

  it("updates editable concept fields without changing identity or graph color", () => {
    const original = findConcept("adaptive-systems");
    const updated = updateConceptRecord(concepts, original.id, { title: "Adaptive practice", kind: "Method", summary: "A practical systems approach.", note: "Revise with examples." }).find((concept) => concept.id === original.id);
    expect(updated).toMatchObject({ id: original.id, color: original.color, title: "Adaptive practice", kind: "Method", summary: "A practical systems approach.", note: "Revise with examples.", updatedAt: "Just now" });
  });
});
