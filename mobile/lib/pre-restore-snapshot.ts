import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Concept, Connection } from "./knowledge-data";
import { parseGraphBackup, serializeGraphBackup, type GraphBackup } from "./relationship-backup";

export const PRE_RESTORE_SNAPSHOT_KEY = "offline-knowledge-graph.pre-restore-snapshot.v1";

export type PreRestoreSnapshot = {
  savedAt: string;
  backup: GraphBackup;
};

/**
 * Saves the current graph before a restore or clear replaces it, so a bad
 * restore is reversible. Returns null when there is nothing to preserve
 * (an empty graph) or the snapshot could not be saved. Only the most recent
 * snapshot is kept; saving a new one replaces the previous one.
 */
export async function savePreRestoreSnapshot(
  concepts: Concept[],
  connections: Connection[],
): Promise<PreRestoreSnapshot | null> {
  if (!concepts.length && !connections.length) return null;
  try {
    const snapshot: PreRestoreSnapshot = {
      savedAt: new Date().toISOString(),
      backup: JSON.parse(serializeGraphBackup(concepts, connections)) as GraphBackup,
    };
    await AsyncStorage.setItem(PRE_RESTORE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return null;
  }
}

export async function loadPreRestoreSnapshot(): Promise<PreRestoreSnapshot | null> {
  try {
    const stored = await AsyncStorage.getItem(PRE_RESTORE_SNAPSHOT_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const { savedAt, backup } = parsed as { savedAt?: unknown; backup?: unknown };
    if (typeof savedAt !== "string" || !backup) return null;
    // Re-validate through the normal backup parser so a corrupt snapshot
    // can never be restored blindly.
    const validated = parseGraphBackup(JSON.stringify(backup));
    return { savedAt, backup: validated };
  } catch {
    return null;
  }
}

export async function clearPreRestoreSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRE_RESTORE_SNAPSHOT_KEY);
  } catch {
    // A stale snapshot is harmless; the next save overwrites it.
  }
}
