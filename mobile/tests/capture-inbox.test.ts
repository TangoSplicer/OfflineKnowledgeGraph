import { describe, expect, it } from "vitest";

import { createCaptureDraft, isCaptureDraft } from "../lib/capture-inbox";

describe("local capture inbox", () => {
  it("normalizes capture content, tags, and source links", () => {
    const draft = createCaptureDraft({ title: "  A reading note ", body: "  Keep this idea.  ", tags: ["Systems, Research", "#systems"], sourceUrls: ["https://example.com/a"] }, 123);
    expect(draft).toMatchObject({ title: "A reading note", body: "Keep this idea.", tags: ["systems", "research"], sourceUrls: ["https://example.com/a"], createdAt: 123 });
  });

  it("recognizes valid persisted capture drafts", () => {
    expect(isCaptureDraft(createCaptureDraft({ title: "A", body: "B" }, 1))).toBe(true);
    expect(isCaptureDraft({ title: "A" })).toBe(false);
  });
});
