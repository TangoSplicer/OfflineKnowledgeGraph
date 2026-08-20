import { describe, expect, it } from "vitest";

import {
  EXPORT_REMINDER_EDIT_THRESHOLD,
  emptyLocalExportStatus,
  localExportStatusLabel,
  recordLocalExport,
  recordLocalGraphEdit,
  shouldShowLocalExportReminder,
} from "../lib/local-export-status";

describe("local export status", () => {
  it("resets the edit count when a complete export succeeds", () => {
    const changed = Array.from({ length: 3 }).reduce(recordLocalGraphEdit, emptyLocalExportStatus());
    const exported = recordLocalExport(changed, new Date("2026-08-18T09:00:00.000Z"));
    expect(exported).toMatchObject({ lastExportedAt: "2026-08-18T09:00:00.000Z", editsSinceLastExport: 0 });
  });

  it("shows an optional reminder only after meaningful local edits", () => {
    const changed = Array.from({ length: EXPORT_REMINDER_EDIT_THRESHOLD }).reduce(recordLocalGraphEdit, emptyLocalExportStatus());
    expect(shouldShowLocalExportReminder(changed)).toBe(true);
    expect(shouldShowLocalExportReminder({ ...changed, remindersEnabled: false })).toBe(false);
  });

  it("labels a successful export using an understandable local date", () => {
    const status = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-18T09:00:00.000Z"));
    expect(localExportStatusLabel(status, new Date("2026-08-18T15:00:00.000Z"))).toBe("Last export today");
    expect(localExportStatusLabel(status, new Date("2026-08-19T15:00:00.000Z"))).toBe("Last export 2026-08-18");
  });

  it("keeps a bounded verified local record with export metadata", () => {
    const exported = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-20T10:00:00.000Z"), { format: "protected-zip", filename: "offline-knowledge-graph-protected.zip", conceptCount: 8, connectionCount: 13 });
    expect(exported.history).toHaveLength(1);
    expect(exported.history[0]).toMatchObject({ format: "protected-zip", filename: "offline-knowledge-graph-protected.zip", conceptCount: 8, connectionCount: 13, verified: true, exportedAt: "2026-08-20T10:00:00.000Z" });
  });
});
