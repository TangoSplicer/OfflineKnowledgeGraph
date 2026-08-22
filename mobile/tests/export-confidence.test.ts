import { describe, expect, it } from "vitest";

import { restoreTestStatusLabel, shouldShowRestoreTestReminder, summarizeLocalBackupHealth } from "../lib/export-confidence";
import { emptyLocalExportStatus, recordLocalExport, recordLocalRestoreTest } from "../lib/local-export-status";

describe("local export confidence", () => {
  it("identifies missing, current, review, and stale local copies deterministically", () => {
    const now = new Date("2026-08-21T12:00:00.000Z");
    expect(summarizeLocalBackupHealth(emptyLocalExportStatus(), now)).toMatchObject({ level: "missing", needsExport: true });
    const current = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-20T12:00:00.000Z"));
    expect(summarizeLocalBackupHealth(current, now)).toMatchObject({ level: "current", needsExport: false });
    const review = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-01T12:00:00.000Z"));
    expect(summarizeLocalBackupHealth(review, now)).toMatchObject({ level: "review", needsExport: false });
    const stale = recordLocalExport(emptyLocalExportStatus(), new Date("2026-07-01T12:00:00.000Z"));
    expect(summarizeLocalBackupHealth(stale, now)).toMatchObject({ level: "stale", needsExport: true });
  });

  it("shows optional restore-test reminders until a test is recorded for the newest local copy", () => {
    const now = new Date("2026-08-21T12:00:00.000Z");
    const exported = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-20T12:00:00.000Z"));
    expect(shouldShowRestoreTestReminder(exported, now)).toBe(true);
    const tested = recordLocalRestoreTest(exported, new Date("2026-08-21T08:00:00.000Z"));
    expect(shouldShowRestoreTestReminder(tested, now)).toBe(false);
    expect(restoreTestStatusLabel(tested, now)).toContain("recorded restore test");
    const newerExport = recordLocalExport(tested, new Date("2026-08-21T10:00:00.000Z"));
    expect(shouldShowRestoreTestReminder(newerExport, now)).toBe(true);
    expect(shouldShowRestoreTestReminder({ ...newerExport, restoreTestRemindersEnabled: false }, now)).toBe(false);
  });
});
