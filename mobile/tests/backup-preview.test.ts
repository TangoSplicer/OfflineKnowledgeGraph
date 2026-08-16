import { describe, expect, it } from "vitest";

import { createBackupPreview } from "../lib/backup-preview";
import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";

describe("backup preview", () => {
  it("summarizes the complete graph before a restore is confirmed", () => {
    const preview = createBackupPreview(createGraphBackup(concepts, connections, "2026-08-13T00:00:00.000Z"));
    expect(preview).toMatchObject({
      exportedAt: "2026-08-13T00:00:00.000Z",
      conceptCount: concepts.length,
      relationshipCount: connections.length,
      notedRelationshipCount: connections.filter((connection) => connection.note).length,
    });
    expect(preview.conceptKinds).toContain("Theory");
  });
});
