import { createGraphBackup, parseGraphBackup, type GraphBackup } from "./relationship-backup";
import { decryptSyncValue, encryptSyncValue, type EncryptedFeedbackEnvelope } from "./encrypted-feedback-sync";
import { selectBackupGraph } from "./selective-import";
import type { Concept, Connection } from "./knowledge-data";

export type CompleteGraphSyncPayload = { schemaVersion: 1; scope?: "complete-graph"; graph: GraphBackup };
export type SelectiveGraphSyncSelection = { conceptIds: string[]; hopDepth?: number; label?: string };
export type SelectiveGraphSyncPayload = { schemaVersion: 1; scope: "subgraph"; selection: SelectiveGraphSyncSelection; graph: GraphBackup };
export type GraphSyncConflictPreview = { localConcepts: number; remoteConcepts: number; mergedConcepts: number; localRelationships: number; remoteRelationships: number; mergedRelationships: number };
export type SelectiveGraphSyncPreview = GraphSyncConflictPreview & { selectedConcepts: number; selectedRelationships: number; newConcepts: number; newRelationships: number; duplicateConcepts: number; duplicateRelationships: number };

function newer<T extends { updatedAt?: string }>(left: T, right: T) { return (right.updatedAt ?? "") > (left.updatedAt ?? "") ? right : left; }
function pairKey(connection: Connection) { return [connection.sourceId, connection.targetId].sort().join("::"); }

export function mergeGraphBackups(local: GraphBackup, remote: GraphBackup): GraphBackup {
  const concepts = new Map<string, Concept>();
  for (const concept of local.concepts) concepts.set(concept.id, concept);
  for (const concept of remote.concepts) concepts.set(concept.id, concepts.has(concept.id) ? newer(concepts.get(concept.id)!, concept) : concept);
  const relationships = new Map<string, Connection>();
  for (const connection of local.connections) relationships.set(pairKey(connection), connection);
  for (const connection of remote.connections) relationships.set(pairKey(connection), connection);
  return createGraphBackup([...concepts.values()], [...relationships.values()], remote.exportedAt > local.exportedAt ? remote.exportedAt : local.exportedAt);
}

export async function encryptCompleteGraph(concepts: Concept[], connections: Connection[], passphrase: string): Promise<EncryptedFeedbackEnvelope> {
  const payload: CompleteGraphSyncPayload = { schemaVersion: 1, scope: "complete-graph", graph: createGraphBackup(concepts, connections) };
  return encryptSyncValue(payload, passphrase);
}

export async function decryptCompleteGraph(raw: string, passphrase: string): Promise<GraphBackup> {
  const payload = await decryptSyncValue<CompleteGraphSyncPayload>(raw, passphrase);
  if (!payload || payload.schemaVersion !== 1 || !payload.graph || (payload.scope !== undefined && payload.scope !== "complete-graph")) throw new Error("This remote profile does not contain a compatible encrypted graph.");
  return parseGraphBackup(JSON.stringify(payload.graph));
}

export function createSelectedGraphBackup(graph: GraphBackup, selection: SelectiveGraphSyncSelection): GraphBackup {
  const selectedIds = new Set(selection.conceptIds);
  const selected = selectBackupGraph(graph, selectedIds);
  if (!selected.concepts.length) throw new Error("Select at least one concept for encrypted subgraph sync.");
  return createGraphBackup(selected.concepts, selected.connections, graph.exportedAt);
}

export async function encryptSelectiveGraph(graph: GraphBackup, selection: SelectiveGraphSyncSelection, passphrase: string): Promise<EncryptedFeedbackEnvelope> {
  const selectedGraph = createSelectedGraphBackup(graph, selection);
  const payload: SelectiveGraphSyncPayload = { schemaVersion: 1, scope: "subgraph", selection: { ...selection, conceptIds: [...new Set(selection.conceptIds)] }, graph: selectedGraph };
  return encryptSyncValue(payload, passphrase);
}

export async function decryptSelectiveGraph(raw: string, passphrase: string): Promise<SelectiveGraphSyncPayload> {
  const payload = await decryptSyncValue<SelectiveGraphSyncPayload>(raw, passphrase);
  if (!payload || payload.schemaVersion !== 1 || payload.scope !== "subgraph" || !payload.selection || !Array.isArray(payload.selection.conceptIds) || !payload.graph) throw new Error("This remote envelope does not contain a compatible encrypted subgraph.");
  const graph = parseGraphBackup(JSON.stringify(payload.graph));
  const selected = createSelectedGraphBackup(graph, payload.selection);
  return { schemaVersion: 1, scope: "subgraph", selection: { ...payload.selection, conceptIds: [...new Set(payload.selection.conceptIds)] }, graph: selected };
}

export function mergeSelectedGraphBackups(local: GraphBackup, remote: GraphBackup, selectedConceptIds: Iterable<string>): GraphBackup {
  const selected = selectBackupGraph(remote, selectedConceptIds);
  const concepts = new Map<string, Concept>(local.concepts.map((concept) => [concept.id, concept]));
  for (const concept of selected.concepts) concepts.set(concept.id, concepts.has(concept.id) ? newer(concepts.get(concept.id)!, concept) : concept);
  const relationships = new Map<string, Connection>(local.connections.map((connection) => [pairKey(connection), connection]));
  for (const connection of selected.connections) {
    const key = pairKey(connection);
    if (!relationships.has(key)) relationships.set(key, connection);
  }
  return createGraphBackup([...concepts.values()], [...relationships.values()], remote.exportedAt > local.exportedAt ? remote.exportedAt : local.exportedAt);
}

export function previewGraphSyncConflict(local: GraphBackup, remote: GraphBackup): GraphSyncConflictPreview {
  const merged = mergeGraphBackups(local, remote);
  return { localConcepts: local.concepts.length, remoteConcepts: remote.concepts.length, mergedConcepts: merged.concepts.length, localRelationships: local.connections.length, remoteRelationships: remote.connections.length, mergedRelationships: merged.connections.length };
}

export function previewSelectiveGraphSync(local: GraphBackup, remote: GraphBackup, selection: SelectiveGraphSyncSelection): SelectiveGraphSyncPreview {
  const selected = createSelectedGraphBackup(remote, selection);
  const merged = mergeSelectedGraphBackups(local, selected, selected.concepts.map((concept) => concept.id));
  const localIds = new Set(local.concepts.map((concept) => concept.id));
  const localPairs = new Set(local.connections.map(pairKey));
  return {
    ...previewGraphSyncConflict(local, selected),
    selectedConcepts: selected.concepts.length,
    selectedRelationships: selected.connections.length,
    newConcepts: selected.concepts.filter((concept) => !localIds.has(concept.id)).length,
    newRelationships: selected.connections.filter((connection) => !localPairs.has(pairKey(connection))).length,
    duplicateConcepts: selected.concepts.filter((concept) => localIds.has(concept.id)).length,
    duplicateRelationships: selected.connections.filter((connection) => localPairs.has(pairKey(connection))).length,
  };
}

export function resolveGraphSyncConflict(local: GraphBackup, remote: GraphBackup, strategy: "merge" | "local" | "remote") { return strategy === "merge" ? mergeGraphBackups(local, remote) : strategy === "local" ? local : remote; }
export function resolveSelectiveGraphSyncConflict(local: GraphBackup, remote: GraphBackup, selection: SelectiveGraphSyncSelection, strategy: "merge" | "local" | "remote") {
  if (strategy === "local") return local;
  if (strategy === "remote") return mergeSelectedGraphBackups(createGraphBackup([], []), remote, selection.conceptIds);
  return mergeSelectedGraphBackups(local, remote, selection.conceptIds);
}
