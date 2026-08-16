import type { Concept, Connection } from "./knowledge-data";

export type FocusNeighborhood = { concepts: Concept[]; connections: Connection[]; conceptIds: Set<string>; hops: number };

export function focusNeighborhood(concepts: Concept[], connections: Connection[], focusId: string, requestedHops: number): FocusNeighborhood {
  const hops = Math.max(1, Math.min(3, Math.round(requestedHops)));
  if (!concepts.some((concept) => concept.id === focusId)) return { concepts: [], connections: [], conceptIds: new Set(), hops };
  const adjacency = new Map<string, string[]>();
  concepts.forEach((concept) => adjacency.set(concept.id, []));
  connections.forEach((connection) => { adjacency.get(connection.sourceId)?.push(connection.targetId); adjacency.get(connection.targetId)?.push(connection.sourceId); });
  const conceptIds = new Set([focusId]); let frontier = new Set([focusId]);
  for (let step = 0; step < hops; step += 1) { const next = new Set<string>(); frontier.forEach((id) => (adjacency.get(id) ?? []).forEach((neighbor) => { if (!conceptIds.has(neighbor)) { conceptIds.add(neighbor); next.add(neighbor); } })); frontier = next; if (!frontier.size) break; }
  return { concepts: concepts.filter((concept) => conceptIds.has(concept.id)), connections: connections.filter((connection) => conceptIds.has(connection.sourceId) && conceptIds.has(connection.targetId)), conceptIds, hops };
}
