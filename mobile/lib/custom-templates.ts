import type { ConceptKind } from "./knowledge-data";
import type { FirstConceptTemplate } from "./concept-templates";

export const CUSTOM_TEMPLATES_KEY = "offline-knowledge-graph.custom-templates.v1";

export type CustomTemplateInput = {
  label: string;
  title: string;
  kind: ConceptKind;
  note: string;
};

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "template";

export function createCustomTemplate(input: CustomTemplateInput, existing: FirstConceptTemplate[]): FirstConceptTemplate {
  const idBase = `custom-${slugify(input.label)}`;
  const duplicateCount = existing.filter((template) => template.id === idBase || template.id.startsWith(`${idBase}-`)).length;
  return { id: duplicateCount ? `${idBase}-${duplicateCount + 1}` : idBase, label: input.label.trim() || "My template", title: input.title.trim(), kind: input.kind, note: input.note.trim(), isCustom: true };
}

export function renameCustomTemplate(templates: FirstConceptTemplate[], id: string, label: string): FirstConceptTemplate[] {
  const nextLabel = label.trim();
  if (!nextLabel) return templates;
  return templates.map((template) => template.id === id ? { ...template, label: nextLabel, isCustom: true } : template);
}

export function removeCustomTemplate(templates: FirstConceptTemplate[], id: string): FirstConceptTemplate[] {
  return templates.filter((template) => template.id !== id);
}

export function parseCustomTemplates(serialized: string | null): FirstConceptTemplate[] {
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const candidate = value as Partial<FirstConceptTemplate>;
      if (typeof candidate.id !== "string" || typeof candidate.label !== "string" || typeof candidate.title !== "string" || typeof candidate.note !== "string" || typeof candidate.kind !== "string") return [];
      return [{ id: candidate.id, label: candidate.label, title: candidate.title, note: candidate.note, kind: candidate.kind as ConceptKind, isCustom: true }];
    });
  } catch { return []; }
}
