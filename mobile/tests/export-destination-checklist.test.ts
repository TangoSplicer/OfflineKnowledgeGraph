import { describe, expect, it } from "vitest";

import {
  exportDestinationChecklist,
  hasCompletedExportDestinationChecklist,
} from "../lib/export-destination-checklist";
import {
  emptyLocalExportStatus,
  recordLocalExport,
  toggleLocalExportDestinationCheck,
} from "../lib/local-export-status";

describe("export destination checklist", () => {
  it("keeps destination reminders incomplete until the owner confirms each local storage step", () => {
    const exported = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-22T12:00:00.000Z"));
    expect(exportDestinationChecklist(exported).map((step) => step.complete)).toEqual([false, false, false]);

    const acknowledged = toggleLocalExportDestinationCheck(exported, "trusted-folder");
    expect(exportDestinationChecklist(acknowledged)[0]).toMatchObject({ id: "trusted-folder", complete: true });
    expect(hasCompletedExportDestinationChecklist(acknowledged)).toBe(false);
  });

  it("records only local confirmations and resets the checklist for a newer export", () => {
    let status = recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-22T12:00:00.000Z"));
    status = toggleLocalExportDestinationCheck(status, "trusted-folder");
    status = toggleLocalExportDestinationCheck(status, "second-copy");
    status = toggleLocalExportDestinationCheck(status, "recovery-plan");
    expect(hasCompletedExportDestinationChecklist(status)).toBe(true);

    const refreshed = recordLocalExport(status, new Date("2026-08-23T12:00:00.000Z"));
    expect(refreshed.exportDestinationChecks).toEqual([]);
  });
});
