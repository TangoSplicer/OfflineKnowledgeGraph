import { describe, expect, it } from "vitest";

import { activeGraphConnections, archiveConceptInState, restoreConceptInState } from "../lib/archive-state";
import { concepts, connections } from "../lib/knowledge-data";

describe("safe local concept archive state", () => {
  it("hides an archived concept and its links from active exploration without deleting them", () => {
    const archived = archiveConceptInState(concepts, [], "feedback-loops", 123);
    expect(archived.active.map((concept) => concept.id)).not.toContain("feedback-loops");
    expect(archived.archived[0]).toMatchObject({ id: "feedback-loops", archivedAt: 123 });
    expect(activeGraphConnections(archived.active, connections).map((connection) => connection.id)).not.toContain("adaptive-feedback");
  });

  it("restores the concept and makes its preserved link eligible for the active graph again", () => {
    const archived = archiveConceptInState(concepts, [], "feedback-loops", 123);
    const restored = restoreConceptInState(archived.active, archived.archived, "feedback-loops");
    expect(restored.active.map((concept) => concept.id)).toContain("feedback-loops");
    expect(activeGraphConnections(restored.active, connections).map((connection) => connection.id)).toContain("adaptive-feedback");
  });
});
