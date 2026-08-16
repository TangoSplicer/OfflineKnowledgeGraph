import { describe, expect, it } from "vitest";

import { createResearchQuestion, isResearchQuestion } from "../lib/research-questions";

describe("research questions", () => {
  it("creates local question records with bounded written context", () => {
    const question = createResearchQuestion({ title: " How should feedback be paced? ", prompt: "For novice learners.", openGap: "A comparative study." }, 42);
    expect(question).toMatchObject({ title: "How should feedback be paced?", prompt: "For novice learners.", openGap: "A comparative study.", createdAt: 42, supportingConceptIds: [], counterpointConceptIds: [] });
  });

  it("recognizes only complete persisted question records", () => {
    expect(isResearchQuestion(createResearchQuestion({ title: "Q", prompt: "", openGap: "" }, 1))).toBe(true);
    expect(isResearchQuestion({ title: "Q" })).toBe(false);
  });
});
