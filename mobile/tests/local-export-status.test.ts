import { describe, expect, it } from "vitest";

import {
  EXPORT_REMINDER_EDIT_THRESHOLD,
  emptyLocalExportStatus,
  filterLocalExportHistory,
  localExportStatusLabel,
  recordLocalExport,
  recordLocalGraphEdit,
  setLocalExportHistoryRetention,
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

  it("persists a chosen bounded retention limit and filters local records without inspecting graph contents", () => {
    const first = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-18T10:00:00.000Z"), { format: "complete-zip", filename: "reading-map.zip", conceptCount: 3, connectionCount: 4 });
    const second = recordLocalExport(first, new Date("2026-08-19T10:00:00.000Z"), { format: "protected-zip", filename: "private-research.zip", conceptCount: 8, connectionCount: 11 });
    const third = recordLocalExport(second, new Date("2026-08-20T10:00:00.000Z"), { format: "complete-zip", filename: "project-map.zip", conceptCount: 5, connectionCount: 7 });
    const retained = setLocalExportHistoryRetention(third, 3);
    expect(retained.historyRetention).toBe(3);
    expect(filterLocalExportHistory(retained.history, "private", "all").map((entry) => entry.filename)).toEqual(["private-research.zip"]);
    expect(filterLocalExportHistory(retained.history, "", "protected-zip")).toHaveLength(1);
  });
});
