import type { ConceptKind } from "./knowledge-data";

export type FirstConceptTemplate = {
  id: string;
  label: string;
  title: string;
  kind: ConceptKind;
  note: string;
  isCustom?: boolean;
};

export const firstConceptTemplates: FirstConceptTemplate[] = [
  {
    id: "reading-note",
    label: "Reading note",
    title: "A useful idea from my reading",
    kind: "Evidence",
    note: "A passage, claim, or argument I want to revisit: ",
  },
  {
    id: "project-plan",
    label: "Project plan",
    title: "A project focus",
    kind: "Method",
    note: "The outcome I want to create, test, or learn from: ",
  },
  {
    id: "open-question",
    label: "Open question",
    title: "A question to explore",
    kind: "Question",
    note: "I want to better understand: ",
  },
];

export const findFirstConceptTemplate = (id: string) =>
  firstConceptTemplates.find((template) => template.id === id) ?? null;
