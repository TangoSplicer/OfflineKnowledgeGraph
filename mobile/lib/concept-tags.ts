import type { Concept } from "./knowledge-data";

export function normalizeConceptTags(values: string[] | undefined): string[] {
  const normalized = (values ?? []).flatMap((value) => value.split(",")).map((value) => value.trim().replace(/^#/, "").replace(/\s+/g, " ").toLowerCase().slice(0, 32)).filter(Boolean);
  return [...new Set(normalized)].slice(0, 10);
}

export const conceptTagsFromText = (value: string) => normalizeConceptTags(value.split(","));
export const conceptTagsToText = (tags: string[] | undefined) => normalizeConceptTags(tags).join(", ");

export function allConceptTags(concepts: Concept[]): string[] {
  return [...new Set(concepts.flatMap((concept) => normalizeConceptTags(concept.tags)))].sort((left, right) => left.localeCompare(right));
}

export function conceptHasTag(concept: Concept, tag: string): boolean {
  return normalizeConceptTags(concept.tags).includes(tag.trim().toLowerCase());
}
