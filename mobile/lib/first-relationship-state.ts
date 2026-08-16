import type { RelationshipType } from "./knowledge-data";

export const FIRST_RELATIONSHIP_WIZARD_KEY = "offline-knowledge-graph.first-relationship-wizard.v1";

export const validateRelationshipTarget = (targetId: string | null, companionTitle: string) =>
  targetId || companionTitle.trim() ? null : "Choose an existing concept or add one companion idea.";

export const defaultFirstRelationshipNote = (relationship: RelationshipType) =>
  `First relationship created during guided setup: ${relationship}.`;
