import { describe, expect, it } from "vitest";

import { findFirstConceptTemplate, firstConceptTemplates } from "../lib/concept-templates";

describe("first-concept templates", () => {
  it("offers distinct, valid general and role-specific starter templates", () => {
    expect(firstConceptTemplates.map((template) => template.id)).toEqual(["reading-note", "project-plan", "open-question", "research-question", "technical-decision", "creative-seed"]);
    expect(firstConceptTemplates.every((template) => template.title.length > 0 && template.note.length > 0)).toBe(true);
  });

  it("finds a known template and safely rejects an unknown template", () => {
    expect(findFirstConceptTemplate("project-plan")).toMatchObject({ kind: "Method", label: "Project plan" });
    expect(findFirstConceptTemplate("not-a-template")).toBeNull();
  });

  it("keeps research, technical, and creative starters aligned to useful concept kinds", () => {
    expect(findFirstConceptTemplate("research-question")).toMatchObject({ kind: "Question", label: "Research question" });
    expect(findFirstConceptTemplate("technical-decision")).toMatchObject({ kind: "Method", label: "Technical decision" });
    expect(findFirstConceptTemplate("creative-seed")).toMatchObject({ kind: "Theory", label: "Creative seed" });
  });
});
