import { describe, expect, it } from "vitest";

import { findFirstConceptTemplate, firstConceptTemplates } from "../lib/concept-templates";

describe("first-concept templates", () => {
  it("offers three distinct, valid starter templates", () => {
    expect(firstConceptTemplates.map((template) => template.id)).toEqual(["reading-note", "project-plan", "open-question"]);
    expect(firstConceptTemplates.every((template) => template.title.length > 0 && template.note.length > 0)).toBe(true);
  });

  it("finds a known template and safely rejects an unknown template", () => {
    expect(findFirstConceptTemplate("project-plan")).toMatchObject({ kind: "Method", label: "Project plan" });
    expect(findFirstConceptTemplate("not-a-template")).toBeNull();
  });
});
