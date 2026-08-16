import { buildGraphNarrative } from "./graph-overview";
import { sameConceptPair, type Concept, type Connection } from "./knowledge-data";
import type { GraphBackup } from "./relationship-backup";

export type ExchangeImportPreview = { importedConcepts: number; importedConnections: number; duplicateConceptIds: string[]; duplicateConnectionIds: string[]; newConcepts: number; newConnections: number };
export function previewKnowledgeExchange(currentConcepts: Concept[], currentConnections: Connection[], incoming: GraphBackup): ExchangeImportPreview {
  const currentIds = new Set(currentConcepts.map((concept) => concept.id));
  const duplicateConceptIds = incoming.concepts.filter((concept) => currentIds.has(concept.id)).map((concept) => concept.id);
  const duplicateConnectionIds = incoming.connections.filter((connection) => currentConnections.some((existing) => sameConceptPair(existing, connection.sourceId, connection.targetId))).map((connection) => connection.id);
  return { importedConcepts: incoming.concepts.length, importedConnections: incoming.connections.length, duplicateConceptIds, duplicateConnectionIds, newConcepts: incoming.concepts.length - duplicateConceptIds.length, newConnections: incoming.connections.length - duplicateConnectionIds.length };
}
export function buildReadableGraphReport(concepts: Concept[], connections: Connection[]): string {
  const narrative = buildGraphNarrative(concepts, connections);
  const lines = ["# Offline Knowledge Graph Report", "", `Generated: ${new Date().toISOString()}`, "", `## ${narrative.headline}`, "", narrative.summary, "", "## Structure", "", narrative.structure, "", "## Relationship Story", "", narrative.relationshipStory, "", "## Concepts", "", ...concepts.map((concept) => `- **${concept.title}** (${concept.kind})${concept.tags.length ? ` — #${concept.tags.join(" #")}` : ""}`), "", "## Relationships", "", ...connections.map((connection) => { const source = concepts.find((concept) => concept.id === connection.sourceId)?.title ?? connection.sourceId; const target = concepts.find((concept) => concept.id === connection.targetId)?.title ?? connection.targetId; return `- ${source} **${connection.relationship}** ${target} · strength ${connection.strength}/5 · evidence ${connection.evidenceConfidence ?? 3}/5${connection.note ? ` — ${connection.note}` : ""}`; }), "", "## Next Actions", "", ...narrative.actions.map((action) => `- ${action}`)];
  return lines.join("\n");
}
