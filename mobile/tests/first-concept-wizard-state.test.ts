import { describe, expect, it } from "vitest";

import {
  FIRST_CONCEPT_WIZARD_KEY,
  previousWizardStep,
  validateWizardNote,
  validateWizardTitle,
  wizardCompletionStatus,
} from "../lib/first-concept-wizard-state";

describe("guided first-concept wizard state", () => {
  it("requires a title and a working note before advancing", () => {
    expect(validateWizardTitle("   ")).toContain("short name");
    expect(validateWizardTitle("Decision fatigue")).toBeNull();
    expect(validateWizardNote("\n")).toContain("one sentence");
    expect(validateWizardNote("Too many choices can drain attention.")).toBeNull();
  });

  it("supports stepwise back navigation without leaving an in-progress wizard", () => {
    expect(previousWizardStep(1)).toBeNull();
    expect(previousWizardStep(2)).toBe(1);
    expect(previousWizardStep(3)).toBe(2);
  });

  it("records distinct local completion states for connected and unconnected finishes", () => {
    expect(FIRST_CONCEPT_WIZARD_KEY).toContain("first-concept-wizard");
    expect(wizardCompletionStatus(false)).toBe("completed");
    expect(wizardCompletionStatus(true)).toBe("completed-with-connection");
  });
});
