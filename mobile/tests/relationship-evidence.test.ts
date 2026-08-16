import { describe, expect, it } from "vitest";

import { clampEvidenceConfidence, confidenceDots, evidenceConfidenceColor, evidenceConfidenceLabel } from "../lib/relationship-evidence";

describe("relationship evidence confidence", () => {
  it("clamps evidence confidence to the supported five-level scale", () => {
    expect(clampEvidenceConfidence(0)).toBe(1);
    expect(clampEvidenceConfidence(8)).toBe(5);
    expect(clampEvidenceConfidence(undefined)).toBe(3);
  });

  it("provides a readable label, color, and deterministic evidence dots", () => {
    expect(evidenceConfidenceLabel(5)).toBe("High confidence");
    expect(evidenceConfidenceColor(1)).toBe("#FF9EAE");
    expect(confidenceDots(4)).toEqual([true, true, true, true, false]);
  });
});
