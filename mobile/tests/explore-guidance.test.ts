import { describe, expect, it } from "vitest";

import { EXPLORE_GUIDANCE_KEY, shouldShowExploreGuidance } from "../lib/explore-guidance";

describe("first Explore guidance", () => {
  it("shows guidance until a user explicitly dismisses it", () => {
    expect(shouldShowExploreGuidance(null)).toBe(true);
    expect(shouldShowExploreGuidance("dismissed")).toBe(false);
    expect(EXPLORE_GUIDANCE_KEY).toContain("explore-guidance");
  });
});
