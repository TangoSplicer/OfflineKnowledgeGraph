import { describe, expect, it } from "vitest";

import { createConceptSearchIndex, searchConceptIndex } from "../lib/full-text-search";
import { concepts } from "../lib/knowledge-data";

const index = createConceptSearchIndex(concepts);

describe("on-device full-text concept search", () => {
  it("prioritizes an exact title phrase over secondary mentions", () => {
    const results = searchConceptIndex(index, "feedback loops");
    expect(results[0]?.concept.id).toBe("feedback-loops");
    expect(results[0]?.matchedFields).toContain("title");
  });

  it("finds a concept using words from its local working note", () => {
    const results = searchConceptIndex(index, "working memory");
    expect(results.map((result) => result.concept.id)).toContain("cognitive-load");
  });

  it("supports prefix discovery while requiring a meaningful local match", () => {
    const results = searchConceptIndex(index, "adapt");
    expect(results[0]?.concept.id).toBe("adaptive-systems");
    expect(searchConceptIndex(index, "unrelated phrase")).toHaveLength(0);
  });

  it("finds concepts through their locally assigned tags", () => {
    const results = searchConceptIndex(index, "people");
    expect(results[0]?.concept.id).toBe("donella-meadows");
    expect(results[0]?.matchedFields).toContain("tags");
  });
});
