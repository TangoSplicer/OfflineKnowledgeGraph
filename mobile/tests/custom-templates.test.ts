import { describe, expect, it } from "vitest";

import { createCustomTemplate, parseCustomTemplates, removeCustomTemplate, renameCustomTemplate } from "../lib/custom-templates";
import { firstConceptTemplates } from "../lib/concept-templates";

describe("custom first-concept templates", () => {
  it("creates stable custom templates without conflicting with built-ins", () => {
    const template = createCustomTemplate({ label: "Research thread", title: "A research thread", kind: "Question", note: "I want to investigate:" }, firstConceptTemplates);
    expect(template).toMatchObject({ id: "custom-research-thread", isCustom: true, kind: "Question" });
  });

  it("restores only structurally valid locally saved templates", () => {
    const restored = parseCustomTemplates(JSON.stringify([{ id: "custom-method", label: "My method", title: "A method", kind: "Method", note: "Try this", isCustom: true }, { invalid: true }]));
    expect(restored).toEqual([expect.objectContaining({ id: "custom-method", isCustom: true })]);
  });

  it("renames and removes a saved template without affecting the others", () => {
    const saved = [createCustomTemplate({ label: "Research thread", title: "A thread", kind: "Question", note: "Investigate this" }, [])];
    const renamed = renameCustomTemplate(saved, saved[0].id, "Field research");
    expect(renamed[0].label).toBe("Field research");
    expect(renameCustomTemplate(renamed, renamed[0].id, "  ")).toEqual(renamed);
    expect(removeCustomTemplate(renamed, renamed[0].id)).toEqual([]);
  });
});
