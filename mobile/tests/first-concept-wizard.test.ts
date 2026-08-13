import { describe, expect, it } from "vitest";

import { addConnection, createConceptRecord } from "../lib/knowledge-data";

describe("first-concept wizard graph actions", () => {
  it("creates a clean local concept record from the wizard inputs", () => {
    const concept = createConceptRecord({ title: "  Decision fatigue  ", kind: "Theory", note: "When too many choices drain attention." }, [], 123);
    expect(concept).toMatchObject({ id: "decision-fatigue", title: "Decision fatigue", kind: "Theory", note: "When too many choices drain attention.", backlinks: 0, updatedAt: "Just now" });
  });

  it("creates one optional companion connection with the selected relationship type", () => {
    const first = createConceptRecord({ title: "Decision fatigue", kind: "Theory", note: "When too many choices drain attention." }, [], 123);
    const companion = createConceptRecord({ title: "Choice architecture", kind: "Method", note: "A possible next question." }, [first], 456);
    const result = addConnection([], { sourceId: first.id, targetId: companion.id, relationship: "supports", strength: 3, note: "First connection created during the guided start." });
    expect(result[0]).toMatchObject({ sourceId: "decision-fatigue", targetId: "choice-architecture", relationship: "supports", strength: 3 });
  });
});
