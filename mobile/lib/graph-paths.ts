import type { Concept, Connection } from "./knowledge-data";

export type GraphPath = { conceptIds: string[]; connections: Connection[] };
export type ConceptComparison = { sharedTags: string[]; directConnection?: Connection; combinedLinks: number; sameKind: boolean };

export function discoverPath(concepts: Concept[], connections: Connection[], startId: string, endId: string): GraphPath | null {
  if (startId === endId || !concepts.some((concept) => concept.id === startId) || !concepts.some((concept) => concept.id === endId)) return null;
  const adjacency = new Map<string, { id: string; connection: Connection }[]>();
  concepts.forEach((concept) => adjacency.set(concept.id, []));
  connections.forEach((connection) => { adjacency.get(connection.sourceId)?.push({ id: connection.targetId, connection }); adjacency.get(connection.targetId)?.push({ id: connection.sourceId, connection }); });
  const queue = [startId]; const previous = new Map<string, { id: string; connection: Connection }>(); const visited = new Set([startId]);
  while (queue.length) { const current = queue.shift()!; for (const next of adjacency.get(current) ?? []) { if (visited.has(next.id)) continue; visited.add(next.id); previous.set(next.id, { id: current, connection: next.connection }); if (next.id === endId) { const conceptIds = [endId]; const pathConnections: Connection[] = []; let cursor = endId; while (cursor !== startId) { const step = previous.get(cursor)!; pathConnections.unshift(step.connection); cursor = step.id; conceptIds.unshift(cursor); } return { conceptIds, connections: pathConnections }; } queue.push(next.id); } }
  return null;
}

export function bridgeConcepts(concepts: Concept[], connections: Connection[], limit = 5): Concept[] {
  const degree = new Map(concepts.map((concept) => [concept.id, 0]));
  connections.forEach((connection) => { degree.set(connection.sourceId, (degree.get(connection.sourceId) ?? 0) + 1); degree.set(connection.targetId, (degree.get(connection.targetId) ?? 0) + 1); });
  return [...concepts].sort((left, right) => (degree.get(right.id) ?? 0) - (degree.get(left.id) ?? 0) || left.title.localeCompare(right.title)).slice(0, limit);
}

export function compareConcepts(left: Concept, right: Concept, connections: Connection[]): ConceptComparison {
  const sharedTags = left.tags.filter((tag) => right.tags.includes(tag));
  const directConnection = connections.find((connection) => (connection.sourceId === left.id && connection.targetId === right.id) || (connection.sourceId === right.id && connection.targetId === left.id));
  const combinedLinks = connections.filter((connection) => [left.id, right.id].includes(connection.sourceId) || [left.id, right.id].includes(connection.targetId)).length;
  return { sharedTags, directConnection, combinedLinks, sameKind: left.kind === right.kind };
}
