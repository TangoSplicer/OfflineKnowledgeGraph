import type { Concept, Connection, RelationshipType } from "./knowledge-data";

export type ExploreQuickFilter = "all" | "noted" | "strong";
export type ExploreRelationshipFilter = RelationshipType | "all";

const normalized = (value: string) => value.trim().toLocaleLowerCase();

export function conceptMatchesQuery(concept: Concept, query: string) {
  const term = normalized(query);
  if (!term) return true;
  return [concept.title, concept.kind, concept.summary, concept.note].some((field) => normalized(field).includes(term));
}

export function matchingConceptIds(concepts: Concept[], query: string) {
  return new Set(concepts.filter((concept) => conceptMatchesQuery(concept, query)).map((concept) => concept.id));
}

export function filterExploreConnections(connections: Connection[], quickFilter: ExploreQuickFilter, relationshipFilter: ExploreRelationshipFilter) {
  return connections.filter((connection) => {
    const quickMatch = quickFilter === "all" || (quickFilter === "noted" ? Boolean(connection.note) : connection.strength >= 4);
    const relationshipMatch = relationshipFilter === "all" || connection.relationship === relationshipFilter;
    return quickMatch && relationshipMatch;
  });
}

export function nearbyConceptsForQuery(concepts: Concept[], connections: Connection[], query: string, centerId = "adaptive-systems") {
  const matchingIds = matchingConceptIds(concepts, query);
  const connectedIds = new Set(connections.flatMap((connection) => [connection.sourceId, connection.targetId]));
  return concepts.filter((concept) => concept.id !== centerId && connectedIds.has(concept.id) && (normalized(query) === "" || matchingIds.has(concept.id)));
}
