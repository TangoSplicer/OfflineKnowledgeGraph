import { decryptSyncValue, encryptSyncValue, type EncryptedFeedbackEnvelope } from "./encrypted-feedback-sync";
import { mergeSyncAuditLedgers, verifySyncAuditLedger, type SyncAuditLedger } from "./sync-audit";

export type EncryptedAuditPayload = { schemaVersion: 1; scope: "sync-audit"; ledger: SyncAuditLedger };
export type AuditSyncConflictPreview = { localEvents: number; remoteEvents: number; mergedEvents: number };

export async function encryptAuditLedger(ledger: SyncAuditLedger, passphrase: string): Promise<EncryptedFeedbackEnvelope> {
  if (!(await verifySyncAuditLedger(ledger))) throw new Error("Cannot encrypt an invalid sync audit history.");
  return encryptSyncValue<EncryptedAuditPayload>({ schemaVersion: 1, scope: "sync-audit", ledger }, passphrase);
}

export async function decryptAuditLedger(raw: string, passphrase: string): Promise<SyncAuditLedger> {
  const payload = await decryptSyncValue<EncryptedAuditPayload>(raw, passphrase);
  if (!payload || payload.schemaVersion !== 1 || payload.scope !== "sync-audit" || !(await verifySyncAuditLedger(payload.ledger))) throw new Error("This remote audit history is not compatible or failed integrity verification.");
  return payload.ledger;
}

export async function previewAuditSyncConflict(local: SyncAuditLedger, remote: SyncAuditLedger): Promise<AuditSyncConflictPreview> {
  const merged = await mergeSyncAuditLedgers(local, remote);
  return { localEvents: local.events.length, remoteEvents: remote.events.length, mergedEvents: merged.events.length };
}

export async function resolveAuditSyncConflict(local: SyncAuditLedger, remote: SyncAuditLedger, strategy: "merge" | "local" | "remote"): Promise<SyncAuditLedger> {
  if (strategy === "local") return local;
  if (strategy === "remote") return remote;
  return mergeSyncAuditLedgers(local, remote);
}
