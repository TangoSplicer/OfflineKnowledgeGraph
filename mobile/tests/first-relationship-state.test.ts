import { describe, expect, it } from "vitest";

import { defaultFirstRelationshipNote, FIRST_RELATIONSHIP_WIZARD_KEY, validateRelationshipTarget } from "../lib/first-relationship-state";

describe("guided first relationship state", () => {
  it("requires a selected or newly named relationship target", () => {
    expect(validateRelationshipTarget(null, "")).toContain("Choose");
    expect(validateRelationshipTarget("feedback-loops", "")).toBeNull();
    expect(validateRelationshipTarget(null, "A companion idea")).toBeNull();
  });

  it("creates a meaningful default note and stable completion key", () => {
    expect(defaultFirstRelationshipNote("supports")).toContain("supports");
    expect(FIRST_RELATIONSHIP_WIZARD_KEY).toContain("first-relationship");
  });
});
