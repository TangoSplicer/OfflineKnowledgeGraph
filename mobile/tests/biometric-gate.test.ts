import { describe, expect, it } from "vitest";

import { biometricPromptFor, requiresSensitiveSyncConfirmation } from "../lib/biometric-gate-state";

describe("sensitive sync confirmation", () => {
  it("classifies recovery, upload, deletion, and revocation as protected operations", () => {
    expect(requiresSensitiveSyncConfirmation("graph-upload")).toBe(true);
    expect(requiresSensitiveSyncConfirmation("device-revoke")).toBe(true);
    expect(requiresSensitiveSyncConfirmation("view-graph")).toBe(false);
    expect(biometricPromptFor("graph-recovery")).toContain("recovery");
  });
});
