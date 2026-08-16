import type { Concept, Connection } from "./knowledge-data";

export type ArchiveSplit = { active: Concept[]; archived: Concept[] };

export function splitArchivedConcepts(concepts: Concept[], archivedConcepts: Concept[] = []): ArchiveSplit {
  const archived = [...archivedConcepts, ...concepts.filter((concept) => concept.archivedAt !== undefined)];
  return { active: concepts.filter((concept) => concept.archivedAt === undefined), archived: archived.filter((concept, index, entries) => entries.findIndex((candidate) => candidate.id === concept.id) === index) };
}

export function archiveConceptInState(active: Concept[], archived: Concept[], conceptId: string, now = Date.now()): ArchiveSplit {
  const concept = active.find((candidate) => candidate.id === conceptId);
  if (!concept) return { active, archived };
  return { active: active.filter((candidate) => candidate.id !== conceptId), archived: [...archived.filter((candidate) => candidate.id !== conceptId), { ...concept, archivedAt: now, updatedAt: "Archived now" }] };
}

export function restoreConceptInState(active: Concept[], archived: Concept[], conceptId: string): ArchiveSplit {
  const concept = archived.find((candidate) => candidate.id === conceptId);
  if (!concept) return { active, archived };
  return { active: [...active, { ...concept, archivedAt: undefined, updatedAt: "Restored now" }], archived: archived.filter((candidate) => candidate.id !== conceptId) };
}

export function activeGraphConnections(activeConcepts: Concept[], connections: Connection[]): Connection[] {
  const activeIds = new Set(activeConcepts.map((concept) => concept.id));
  return connections.filter((connection) => activeIds.has(connection.sourceId) && activeIds.has(connection.targetId));
}
