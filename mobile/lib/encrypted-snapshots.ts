import AsyncStorage from "@react-native-async-storage/async-storage";
import { decryptCompleteGraph, encryptCompleteGraph } from "./encrypted-graph-sync";
import { type GraphBackup } from "./relationship-backup";

export const ENCRYPTED_SNAPSHOTS_KEY = "offline_knowledge_graph_encrypted_snapshots_v1";
export const MAX_RETAINED_SNAPSHOTS = 10;

export type EncryptedSnapshotItem = {
  id: string;
  createdAt: string;
  label: string;
  conceptCount: number;
  relationshipCount: number;
  envelope: string;
};

export async function loadEncryptedSnapshots(): Promise<EncryptedSnapshotItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ENCRYPTED_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEncryptedSnapshot(backup: GraphBackup, passphrase: string, label = "Automated backup snapshot"): Promise<EncryptedSnapshotItem[]> {
  const envelope = await encryptCompleteGraph(backup.concepts, backup.connections, passphrase);
  const snapshot: EncryptedSnapshotItem = {
    id: `snapshot-${Date.now()}`,
    createdAt: new Date().toISOString(),
    label: label.trim() || "Backup snapshot",
    conceptCount: backup.concepts.length,
    relationshipCount: backup.connections.length,
    envelope: JSON.stringify(envelope),
  };
  const existing = await loadEncryptedSnapshots();
  const next = [snapshot, ...existing].slice(0, MAX_RETAINED_SNAPSHOTS);
  await AsyncStorage.setItem(ENCRYPTED_SNAPSHOTS_KEY, JSON.stringify(next));
  return next;
}

export async function restoreEncryptedSnapshot(snapshot: EncryptedSnapshotItem, passphrase: string): Promise<GraphBackup> {
  return decryptCompleteGraph(snapshot.envelope, passphrase);
}

export async function clearEncryptedSnapshots(): Promise<void> {
  await AsyncStorage.removeItem(ENCRYPTED_SNAPSHOTS_KEY);
}
