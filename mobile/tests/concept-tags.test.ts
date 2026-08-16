import { describe, expect, it } from "vitest";

import { allConceptTags, conceptHasTag, conceptTagsFromText, conceptTagsToText, normalizeConceptTags } from "../lib/concept-tags";
import { concepts } from "../lib/knowledge-data";

describe("local concept tags", () => {
  it("normalizes, deduplicates, and bounds user-entered tags", () => {
    expect(normalizeConceptTags([" #Systems ", "systems", "Field Research"])).toEqual(["systems", "field research"]);
    expect(conceptTagsFromText("research, #methods, research")).toEqual(["research", "methods"]);
    expect(conceptTagsToText(["Research", "#Methods"])).toBe("research, methods");
  });

  it("derives stable tags and matches them on stored concepts", () => {
    expect(allConceptTags(concepts)).toContain("systems");
    expect(conceptHasTag(concepts[0], "systems")).toBe(true);
    expect(conceptHasTag(concepts[0], "people")).toBe(false);
  });
});
