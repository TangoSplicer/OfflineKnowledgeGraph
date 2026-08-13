import { describe, expect, it } from "vitest";

import { connections } from "../lib/knowledge-data";
import { createRelationshipBackup, parseRelationshipBackup, serializeRelationshipBackup } from "../lib/relationship-backup";

describe("relationship JSON backups", () => {
  it("serializes a versioned backup that preserves relationship notes", () => {
    const backup = createRelationshipBackup(connections, "2026-08-13T00:00:00.000Z");
    const serialized = JSON.parse(serializeRelationshipBackup(connections));
    expect(serialized.schemaVersion).toBe(1);
    expect(serialized.connections[0].note).toBe(connections[0].note);
    expect(backup.exportedAt).toBe("2026-08-13T00:00:00.000Z");
    expect(backup.connections[0]).toMatchObject({ id: "adaptive-feedback", note: connections[0].note });
  });

  it("restores valid data while clamping strengths and trimming notes", () => {
    const restored = parseRelationshipBackup(JSON.stringify({ schemaVersion: 1, exportedAt: "2026-08-13T00:00:00.000Z", connections: [{ ...connections[0], strength: 8, note: "  Restore this reasoning.  " }] }));
    expect(restored.connections[0]).toMatchObject({ strength: 5, note: "Restore this reasoning." });
  });

  it("rejects invalid schemas and duplicate relationship pairs", () => {
    expect(() => parseRelationshipBackup("not-json")).toThrow("not valid JSON");
    expect(() => parseRelationshipBackup(JSON.stringify({ schemaVersion: 1, connections: [connections[0], { ...connections[0], id: "duplicate", sourceId: connections[0].targetId, targetId: connections[0].sourceId }] }))).toThrow("duplicate relationships");
  });
});
