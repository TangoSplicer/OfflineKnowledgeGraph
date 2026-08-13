import type { Concept, Connection } from "./knowledge-data";

export const visibleGraphConnections = (graphConcepts: Concept[], graphConnections: Connection[], compact = false) => {
  const visibleIds = new Set((compact ? graphConcepts.filter((concept) => concept.id !== "donella-meadows") : graphConcepts).map((concept) => concept.id));
  return graphConnections.filter((connection) => visibleIds.has(connection.sourceId) && visibleIds.has(connection.targetId));
};
