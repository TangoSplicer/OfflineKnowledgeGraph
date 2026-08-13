import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup, parseGraphBackup, serializeGraphBackup } from "../lib/relationship-backup";

describe("complete graph JSON backups", () => {
  it("serializes concepts and relationships with notes in a versioned snapshot", () => {
    const backup = createGraphBackup(concepts, connections, "2026-08-13T00:00:00.000Z");
    const serialized = JSON.parse(serializeGraphBackup(concepts, connections));
    expect(serialized.schemaVersion).toBe(2);
    expect(serialized.concepts).toHaveLength(concepts.length);
    expect(serialized.concepts.map((concept: { id: string }) => concept.id)).toContain("adaptive-systems");
    expect(serialized.connections[0]).toMatchObject({ note: connections[0].note });
    expect(backup.exportedAt).toBe("2026-08-13T00:00:00.000Z");
    expect(backup.concepts.map((concept) => concept.title)).toContain("Adaptive Systems");
    expect(backup.connections[0]).toMatchObject({ id: "adaptive-feedback", note: connections[0].note });
  });

  it("restores complete data while clamping strengths and trimming notes", () => {
    const conceptsForRelationship = concepts.filter((concept) => [connections[0].sourceId, connections[0].targetId].includes(concept.id));
    const restored = parseGraphBackup(JSON.stringify({ schemaVersion: 2, exportedAt: "2026-08-13T00:00:00.000Z", concepts: conceptsForRelationship.map((concept) => concept.id === "adaptive-systems" ? { ...concept, note: "  Restored concept note.  " } : concept), connections: [{ ...connections[0], strength: 8, note: "  Restore this reasoning.  " }] }));
    expect(restored.concepts[0]).toMatchObject({ id: "adaptive-systems", note: "Restored concept note." });
    expect(restored.connections[0]).toMatchObject({ strength: 5, note: "Restore this reasoning." });
  });

  it("rejects invalid schemas, unknown endpoints, duplicate concepts, and duplicate pairs", () => {
    expect(() => parseGraphBackup("not-json")).toThrow("not valid JSON");
    expect(() => parseGraphBackup(JSON.stringify({ schemaVersion: 1, concepts, connections }))).toThrow("compatible");
    expect(() => parseGraphBackup(JSON.stringify({ schemaVersion: 2, concepts: [{ ...concepts[0], id: "duplicate" }, { ...concepts[0], id: "duplicate" }], connections: [] }))).toThrow("duplicate concepts");
    expect(() => parseGraphBackup(JSON.stringify({ schemaVersion: 2, concepts, connections: [{ ...connections[0], sourceId: "missing" }] }))).toThrow("cannot be restored");
    expect(() => parseGraphBackup(JSON.stringify({ schemaVersion: 2, concepts, connections: [connections[0], { ...connections[0], id: "reverse", sourceId: connections[0].targetId, targetId: connections[0].sourceId }] }))).toThrow("duplicate relationships");
  });
});
