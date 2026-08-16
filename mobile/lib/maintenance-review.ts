import type { Concept, Connection } from "./knowledge-data";
import { evidenceReviewSummary } from "./evidence-review";

export type MaintenanceCue = { id: string; title: string; detail: string; tone: "attention" | "research" | "structure" };
export function maintenanceCues(concepts: Concept[], connections: Connection[]): MaintenanceCue[] {
  const evidence = evidenceReviewSummary(concepts, connections);
  const degree = new Map(concepts.map((concept) => [concept.id, 0]));
  connections.forEach((connection) => { degree.set(connection.sourceId, (degree.get(connection.sourceId) ?? 0) + 1); degree.set(connection.targetId, (degree.get(connection.targetId) ?? 0) + 1); });
  const isolated = concepts.filter((concept) => (degree.get(concept.id) ?? 0) === 0).length;
  const cues: MaintenanceCue[] = [];
  if (evidence.weak) cues.push({ id: "weak", title: "Review tentative links", detail: `${evidence.weak} relationship${evidence.weak === 1 ? " has" : "s have"} low evidence confidence.`, tone: "attention" });
  if (evidence.uncited) cues.push({ id: "uncited", title: "Add source links", detail: `${evidence.uncited} relationship${evidence.uncited === 1 ? " lacks" : "s lack"} a supporting source.`, tone: "research" });
  if (isolated) cues.push({ id: "isolated", title: "Reconnect isolated ideas", detail: `${isolated} concept${isolated === 1 ? " is" : "s are"} not yet visible through graph paths.`, tone: "structure" });
  if (!cues.length) cues.push({ id: "healthy", title: "Graph maintenance is on track", detail: "Every active relationship has a source and no immediate evidence gaps are detected.", tone: "research" });
  return cues;
}
