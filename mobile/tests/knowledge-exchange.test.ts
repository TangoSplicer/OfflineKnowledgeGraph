import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { buildReadableGraphReport, previewKnowledgeExchange } from "../lib/knowledge-exchange";
import { createGraphBackup } from "../lib/relationship-backup";

describe("knowledge exchange", () => {
  it("reports duplicates and new records before import", () => {
    const preview = previewKnowledgeExchange(concepts.slice(0, 1), [], createGraphBackup(concepts, connections, "2026-08-14T00:00:00.000Z"));
    expect(preview.duplicateConceptIds).toContain(concepts[0].id);
    expect(preview.newConcepts).toBe(concepts.length - 1);
  });

  it("builds a readable local graph report", () => {
    const report = buildReadableGraphReport(concepts, connections);
    expect(report).toContain("# Offline Knowledge Graph Report");
    expect(report).toContain("## Relationships");
  });
});
