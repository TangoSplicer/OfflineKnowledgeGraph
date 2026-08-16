import { sameConceptPair, type Concept, type Connection } from "./knowledge-data";
import type { GraphBackup } from "./relationship-backup";

export function selectBackupGraph(backup: GraphBackup, selectedConceptIds: Iterable<string>) {
  const selectedIds = new Set(selectedConceptIds);
  const concepts = backup.concepts.filter((concept) => selectedIds.has(concept.id));
  const connections = backup.connections.filter((connection) => selectedIds.has(connection.sourceId) && selectedIds.has(connection.targetId));
  return { concepts, connections };
}

export function mergeSelectedGraphImport(currentConcepts: Concept[], currentConnections: Connection[], backup: GraphBackup, selectedConceptIds: Iterable<string>) {
  const selected = selectBackupGraph(backup, selectedConceptIds);
  const currentIds = new Set(currentConcepts.map((concept) => concept.id));
  const importedConcepts = selected.concepts.filter((concept) => !currentIds.has(concept.id));
  const finalConcepts = [...currentConcepts, ...importedConcepts];
  const finalIds = new Set(finalConcepts.map((concept) => concept.id));
  const importedConnections = selected.connections.filter((connection) => finalIds.has(connection.sourceId) && finalIds.has(connection.targetId) && !currentConnections.some((existing) => sameConceptPair(existing, connection.sourceId, connection.targetId)));
  return { concepts: finalConcepts, connections: [...currentConnections, ...importedConnections], importedConcepts, importedConnections };
}
