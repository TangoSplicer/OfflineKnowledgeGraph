import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";
import { mergeSelectedGraphImport, selectBackupGraph } from "../lib/selective-import";

const backup = createGraphBackup(concepts, connections, "2026-08-13T00:00:00.000Z");

describe("selective graph import", () => {
  it("includes a relationship only when both selected concepts are present", () => {
    const one = selectBackupGraph(backup, ["adaptive-systems"]);
    expect(one.connections).toHaveLength(0);
    const paired = selectBackupGraph(backup, ["adaptive-systems", "feedback-loops"]);
    expect(paired.connections.map((connection) => connection.id)).toContain("adaptive-feedback");
  });

  it("merges selected records without overwriting current concepts or duplicate links", () => {
    const currentConcepts = concepts.filter((concept) => concept.id === "adaptive-systems");
    const merged = mergeSelectedGraphImport(currentConcepts, [], backup, ["adaptive-systems", "feedback-loops"]);
    expect(merged.concepts.map((concept) => concept.id)).toEqual(expect.arrayContaining(["adaptive-systems", "feedback-loops"]));
    expect(merged.importedConnections.map((connection) => connection.id)).toContain("adaptive-feedback");
  });
});
