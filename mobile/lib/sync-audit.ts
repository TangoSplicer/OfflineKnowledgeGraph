import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export const SYNC_AUDIT_SCHEMA_VERSION = 1 as const;
export const SYNC_AUDIT_STORAGE_KEY = "offline-knowledge-graph.sync-audit.v1";
const GENESIS_DIGEST = "GENESIS";
const MAX_AUDIT_EVENTS = 200;

type AuditValue = string | number | boolean;
export type SyncAuditMetadata = Record<string, AuditValue>;
export type SyncAuditScope = "complete-graph" | "subgraph" | "feedback-profile" | "schedule" | "trusted-device";
export type SyncAuditOperation =
  | "device-trusted"
  | "device-revoked"
  | "graph-downloaded"
  | "graph-uploaded"
  | "graph-removed"
  | "conflict-reviewed"
  | "subgraph-previewed"
  | "subgraph-downloaded"
  | "subgraph-uploaded"
  | "subgraph-recovered"
  | "backup-scheduled"
  | "backup-paused"
  | "backup-executed"
  | "backup-failed"
  | "snapshot-created"
  | "snapshot-restored"
  | "audit-merged";

export type SyncAuditEvent = {
  id: string;
  createdAt: string;
  operation: SyncAuditOperation;
  scope: SyncAuditScope;
  deviceId?: string;
  summary: string;
  metadata: SyncAuditMetadata;
  previousDigest: string;
  digest: string;
};

export type SyncAuditLedger = {
  schemaVersion: typeof SYNC_AUDIT_SCHEMA_VERSION;
  events: SyncAuditEvent[];
};

type NewAuditEvent = Omit<SyncAuditEvent, "id" | "previousDigest" | "digest"> & { id?: string };

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

function canonicalEvent(event: Omit<SyncAuditEvent, "digest">): string {
  return JSON.stringify(stableValue(event));
}

async function digestEvent(event: Omit<SyncAuditEvent, "digest"> | SyncAuditEvent): Promise<string> {
  const { digest: _digest, ...unsigned } = event as SyncAuditEvent;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonicalEvent(unsigned));
}

function emptyLedger(): SyncAuditLedger {
  return { schemaVersion: SYNC_AUDIT_SCHEMA_VERSION, events: [] };
}

function createId(): string {
  return Crypto.randomUUID();
}

export async function appendSyncAuditEvent(ledger: SyncAuditLedger, event: NewAuditEvent): Promise<SyncAuditLedger> {
  if (ledger.schemaVersion !== SYNC_AUDIT_SCHEMA_VERSION) throw new Error("This sync audit history uses an unsupported format.");
  const previousDigest = ledger.events.at(-1)?.digest ?? GENESIS_DIGEST;
  const unsigned: Omit<SyncAuditEvent, "digest"> = {
    id: event.id ?? createId(),
    createdAt: event.createdAt,
    operation: event.operation,
    scope: event.scope,
    deviceId: event.deviceId,
    summary: event.summary.trim().slice(0, 240),
    metadata: event.metadata,
    previousDigest,
  };
  const next: SyncAuditEvent = { ...unsigned, digest: await digestEvent(unsigned) };
  return { schemaVersion: SYNC_AUDIT_SCHEMA_VERSION, events: [...ledger.events, next].slice(-MAX_AUDIT_EVENTS) };
}

export async function createSyncAuditEvent(event: NewAuditEvent): Promise<SyncAuditEvent> {
  const ledger = await appendSyncAuditEvent(emptyLedger(), event);
  return ledger.events[0];
}

export async function verifySyncAuditLedger(ledger: SyncAuditLedger): Promise<boolean> {
  if (!ledger || ledger.schemaVersion !== SYNC_AUDIT_SCHEMA_VERSION || !Array.isArray(ledger.events) || ledger.events.length > MAX_AUDIT_EVENTS) return false;
  let previousDigest = GENESIS_DIGEST;
  for (const event of ledger.events) {
    if (!event || event.previousDigest !== previousDigest || typeof event.digest !== "string" || typeof event.id !== "string" || typeof event.createdAt !== "string" || typeof event.summary !== "string") return false;
    const expected = await digestEvent(event);
    if (expected !== event.digest) return false;
    previousDigest = event.digest;
  }
  return true;
}

export async function loadSyncAuditLedger(): Promise<SyncAuditLedger> {
  const raw = await AsyncStorage.getItem(SYNC_AUDIT_STORAGE_KEY);
  if (!raw) return emptyLedger();
  try {
    const parsed = JSON.parse(raw) as SyncAuditLedger;
    if (!(await verifySyncAuditLedger(parsed))) throw new Error("Local sync audit history failed integrity verification.");
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.includes("integrity verification")) throw error;
    throw new Error("Local sync audit history could not be read safely.");
  }
}

export async function saveSyncAuditLedger(ledger: SyncAuditLedger): Promise<void> {
  if (!(await verifySyncAuditLedger(ledger))) throw new Error("Refusing to save an invalid sync audit history.");
  await AsyncStorage.setItem(SYNC_AUDIT_STORAGE_KEY, JSON.stringify(ledger));
}

export async function appendAndSaveSyncAuditEvent(event: NewAuditEvent): Promise<SyncAuditLedger> {
  const next = await appendSyncAuditEvent(await loadSyncAuditLedger(), event);
  await saveSyncAuditLedger(next);
  return next;
}

export async function mergeSyncAuditLedgers(local: SyncAuditLedger, remote: SyncAuditLedger): Promise<SyncAuditLedger> {
  if (!(await verifySyncAuditLedger(local)) || !(await verifySyncAuditLedger(remote))) throw new Error("Cannot merge a sync audit history that failed integrity verification.");
  const unique = new Map<string, SyncAuditEvent>();
  for (const event of [...local.events, ...remote.events]) unique.set(event.id, event);
  const sorted = [...unique.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
  let merged = emptyLedger();
  for (const event of sorted) {
    merged = await appendSyncAuditEvent(merged, {
      id: event.id,
      createdAt: event.createdAt,
      operation: event.operation,
      scope: event.scope,
      deviceId: event.deviceId,
      summary: event.summary,
      metadata: event.metadata,
    });
  }
  return merged;
}

export function auditOperationLabel(operation: SyncAuditOperation): string {
  return operation.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export { emptyLedger as createEmptySyncAuditLedger };
