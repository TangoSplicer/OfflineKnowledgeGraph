import { describe, expect, it } from "vitest";

import { firstExportChecklist, shouldShowFirstExportChecklist } from "../lib/first-export-checklist";
import { emptyLocalExportStatus, recordLocalExport } from "../lib/local-export-status";

describe("first export checklist", () => {
  it("guides a new local workspace through review, optional protection, and export", () => {
    const steps = firstExportChecklist(3, 2, false);
    expect(steps.map((step) => step.id)).toEqual(["review", "protection", "export"]);
    expect(steps[0]).toMatchObject({ complete: true, detail: expect.stringContaining("3 concepts and 2 relationships") });
    expect(steps[1]).toMatchObject({ actionLabel: "Add passphrase", complete: false });
    expect(steps[2]).toMatchObject({ actionLabel: "Export ZIP", complete: false });
  });

  it("updates protection language and removes the first-export guide after a verified local export", () => {
    expect(firstExportChecklist(1, 0, true)[1]).toMatchObject({ title: "Protection is selected", complete: true });
    expect(firstExportChecklist(1, 0, true)[2]).toMatchObject({ actionLabel: undefined, detail: expect.stringContaining("passphrase fields") });
    expect(shouldShowFirstExportChecklist(emptyLocalExportStatus())).toBe(true);
    expect(shouldShowFirstExportChecklist(recordLocalExport(emptyLocalExportStatus(), new Date("2026-08-21T00:00:00.000Z")))).toBe(false);
  });
});
