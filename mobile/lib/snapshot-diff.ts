import { type GraphBackup } from "./relationship-backup";

export type SnapshotDiffResult = {
  localConceptsCount: number;
  snapshotConceptsCount: number;
  newConceptIds: string[];
  removedConceptIds: string[];
  modifiedConceptIds: string[];
  localConnectionsCount: number;
  snapshotConnectionsCount: number;
  newConnectionIds: string[];
  removedConnectionIds: string[];
};

export function compareSnapshotWithLocal(local: GraphBackup, snapshot: GraphBackup): SnapshotDiffResult {
  const localConceptMap = new Map(local.concepts.map((item) => [item.id, item]));
  const snapshotConceptMap = new Map(snapshot.concepts.map((item) => [item.id, item]));

  const localConnectionMap = new Map(local.connections.map((item) => [item.id, item]));
  const snapshotConnectionMap = new Map(snapshot.connections.map((item) => [item.id, item]));

  const newConceptIds: string[] = [];
  const removedConceptIds: string[] = [];
  const modifiedConceptIds: string[] = [];

  for (const [id, snapItem] of snapshotConceptMap.entries()) {
    const localItem = localConceptMap.get(id);
    if (!localItem) {
      newConceptIds.push(id);
    } else if (localItem.title !== snapItem.title || localItem.summary !== snapItem.summary || localItem.kind !== snapItem.kind) {
      modifiedConceptIds.push(id);
    }
  }

  for (const id of localConceptMap.keys()) {
    if (!snapshotConceptMap.has(id)) {
      removedConceptIds.push(id);
    }
  }

  const newConnectionIds: string[] = [];
  const removedConnectionIds: string[] = [];

  for (const id of snapshotConnectionMap.keys()) {
    if (!localConnectionMap.has(id)) newConnectionIds.push(id);
  }

  for (const id of localConnectionMap.keys()) {
    if (!snapshotConnectionMap.has(id)) removedConnectionIds.push(id);
  }

  return {
    localConceptsCount: local.concepts.length,
    snapshotConceptsCount: snapshot.concepts.length,
    newConceptIds,
    removedConceptIds,
    modifiedConceptIds,
    localConnectionsCount: local.connections.length,
    snapshotConnectionsCount: snapshot.connections.length,
    newConnectionIds,
    removedConnectionIds,
  };
}
