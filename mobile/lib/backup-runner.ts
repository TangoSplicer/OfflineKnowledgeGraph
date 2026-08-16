import AsyncStorage from "@react-native-async-storage/async-storage";

import { createGraphBackup, type GraphBackup } from "./relationship-backup";
import { encryptCompleteGraph } from "./encrypted-graph-sync";
import { saveEncryptedSnapshot } from "./encrypted-snapshots";
import { notifyBackupAttention, notifyBackupCompleted } from "./backup-notifications";
import { getScheduledBackupPassphrase } from "./backup-key";
import { appendAndSaveSyncAuditEvent } from "./sync-audit";
import { syncProgress, type SyncProgressState } from "./sync-progress";
import { getOrCreateTrustedDevice } from "./trusted-devices";
import { createTRPCClient } from "./trpc";
import { BACKUP_SCHEDULE_STORAGE_KEY, getDueBackupSchedules, markBackupScheduleFailure, markBackupScheduleRun, normalizeBackupSchedules, type BackupSchedule } from "./backup-schedules";
import type { Concept, Connection } from "./knowledge-data";

const GRAPH_STORAGE_KEY = "offline-knowledge-graph.graph.v2";

type PersistedGraph = { concepts?: Concept[]; archivedConcepts?: Concept[]; connections?: Connection[] };

export async function loadBackupSchedules(): Promise<BackupSchedule[]> {
  const raw = await AsyncStorage.getItem(BACKUP_SCHEDULE_STORAGE_KEY);
  if (!raw) return [];
  try { return normalizeBackupSchedules(JSON.parse(raw)); } catch { return []; }
}

export async function saveBackupSchedules(schedules: BackupSchedule[]): Promise<void> {
  await AsyncStorage.setItem(BACKUP_SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
}

export async function upsertBackupSchedule(schedule: BackupSchedule): Promise<BackupSchedule[]> {
  const schedules = await loadBackupSchedules();
  const next = [...schedules.filter((item) => item.id !== schedule.id), schedule].sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt));
  await saveBackupSchedules(next);
  return next;
}

export async function removeBackupSchedule(id: string): Promise<BackupSchedule[]> {
  const next = (await loadBackupSchedules()).filter((schedule) => schedule.id !== id);
  await saveBackupSchedules(next);
  return next;
}

export async function loadPersistedGraphBackup(): Promise<GraphBackup> {
  const raw = await AsyncStorage.getItem(GRAPH_STORAGE_KEY);
  if (!raw) throw new Error("No local graph is available for encrypted backup.");
  let parsed: PersistedGraph;
  try { parsed = JSON.parse(raw) as PersistedGraph; } catch { throw new Error("The local graph could not be read safely for encrypted backup."); }
  const concepts = [...(parsed.concepts ?? []), ...(parsed.archivedConcepts ?? [])];
  const connections = parsed.connections ?? [];
  if (!concepts.length) throw new Error("Create at least one concept before scheduling an encrypted backup.");
  return createGraphBackup(concepts, connections);
}

export type BackupRunResult = { attempted: number; completed: number; skipped: number; schedules: BackupSchedule[]; messages: string[] };
export type BackupProgressReporter = (progress: SyncProgressState) => void;

export async function runDueEncryptedBackups(now = new Date(), reportProgress?: BackupProgressReporter): Promise<BackupRunResult> {
  const schedules = await loadBackupSchedules();
  const due = getDueBackupSchedules(schedules, now);
  if (!due.length) { reportProgress?.(syncProgress("idle")); return { attempted: 0, completed: 0, skipped: 0, schedules, messages: [] }; }
  const nextSchedules = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const messages: string[] = [];
  let completed = 0;
  let skipped = 0;
  let passphrase: string | null = null;
  reportProgress?.(syncProgress("authorizing", "Unlocking the protected backup key"));
  try { passphrase = await getScheduledBackupPassphrase(); } catch { passphrase = null; }
  if (!passphrase) {
    for (const schedule of due) {
      const failed = markBackupScheduleFailure(schedule, "Unlock the scheduled backup key before automatic execution can continue.", now);
      nextSchedules.set(schedule.id, failed);
      skipped += 1;
      messages.push(`${schedule.frequency} backup skipped: the protected backup key is unavailable.`);
      await appendAndSaveSyncAuditEvent({ createdAt: now.toISOString(), operation: "backup-failed", scope: "schedule", summary: "Automatic encrypted backup was skipped", metadata: { scheduleId: schedule.id, reason: "protected-key-unavailable" } });
      await notifyBackupAttention("Unlock the protected backup key before automatic execution can continue.", schedule.id, "failure").catch(() => false);
    }
    const resultSchedules = [...nextSchedules.values()];
    await saveBackupSchedules(resultSchedules);
    reportProgress?.(syncProgress("error", "Unlock the protected backup key to continue"));
    return { attempted: due.length, completed, skipped, schedules: resultSchedules, messages };
  }

  let graph: GraphBackup;
  reportProgress?.(syncProgress("verifying", "Preparing the local graph for encryption"));
  try { graph = await loadPersistedGraphBackup(); } catch (error) {
    const reason = error instanceof Error ? error.message : "The local graph could not be prepared.";
    for (const schedule of due) {
      const failed = markBackupScheduleFailure(schedule, reason, now);
      nextSchedules.set(schedule.id, failed);
      skipped += 1;
      messages.push(reason);
      await appendAndSaveSyncAuditEvent({ createdAt: now.toISOString(), operation: "backup-failed", scope: "schedule", summary: "Automatic encrypted backup could not prepare the local graph", metadata: { scheduleId: schedule.id, reason: "local-graph-unavailable" } });
      await notifyBackupAttention(reason, schedule.id, "failure").catch(() => false);
    }
    const resultSchedules = [...nextSchedules.values()];
    await saveBackupSchedules(resultSchedules);
    reportProgress?.(syncProgress("error", reason));
    return { attempted: due.length, completed, skipped, schedules: resultSchedules, messages };
  }

  try {
    const device = await getOrCreateTrustedDevice();
    const client = createTRPCClient();
    for (const schedule of due) {
      try {
        reportProgress?.(syncProgress("fetching", "Checking the encrypted remote revision"));
        const remote = await client.graphSync.get.query({ deviceId: device.id });
        reportProgress?.(syncProgress("encrypting", "Encrypting graph on this device"));
        const envelope = JSON.stringify(await encryptCompleteGraph(graph.concepts, graph.connections, passphrase));
        reportProgress?.(syncProgress("uploading", "Uploading encrypted backup envelope"));
        const saved = await client.graphSync.put.mutate({ deviceId: device.id, envelope, expectedRevision: remote?.revision ?? 0 });
        if (saved.status === "conflict") {
          const failed = markBackupScheduleFailure(schedule, "A newer remote graph exists. Review the conflict before automatic backup overwrites anything.", now);
          nextSchedules.set(schedule.id, failed);
          skipped += 1;
          messages.push("Automatic backup paused itself after detecting a newer remote graph.");
          await appendAndSaveSyncAuditEvent({ createdAt: now.toISOString(), operation: "backup-failed", scope: "schedule", deviceId: device.id, summary: "Automatic backup refused a remote conflict", metadata: { scheduleId: schedule.id, reason: "revision-conflict" } });
          await notifyBackupAttention("A newer remote graph exists. Review the conflict before automatic backup resumes.", schedule.id, "conflict").catch(() => false);
          reportProgress?.(syncProgress("review", "A newer encrypted backup needs review"));
          continue;
        }
        reportProgress?.(syncProgress("verifying", "Saving protected snapshot history"));
        await saveEncryptedSnapshot(graph, passphrase, `Automatic ${schedule.frequency} backup · revision ${saved.revision}`);
        const conceptKinds = JSON.stringify([...new Set(graph.concepts.map((concept) => concept.kind))].sort());
        const conceptTags = JSON.stringify([...new Set(graph.concepts.flatMap((concept) => concept.tags))].sort());
        await client.graphSnapshots.put.mutate({ deviceId: device.id, id: `snapshot-${schedule.id}-${now.getTime()}`, sourceRevision: saved.revision, label: `Automatic ${schedule.frequency} backup · revision ${saved.revision}`, envelope, conceptCount: graph.concepts.length, relationshipCount: graph.connections.length, conceptKinds, conceptTags });
        await notifyBackupCompleted(saved.revision, schedule.id).catch(() => false);
        const completedSchedule = markBackupScheduleRun(schedule, now);
        nextSchedules.set(schedule.id, completedSchedule);
        completed += 1;
        messages.push(`Encrypted backup completed at revision ${saved.revision}.`);
        await appendAndSaveSyncAuditEvent({ createdAt: now.toISOString(), operation: "backup-executed", scope: "schedule", deviceId: device.id, summary: "Automatic encrypted backup completed", metadata: { scheduleId: schedule.id, revision: saved.revision, concepts: graph.concepts.length, relationships: graph.connections.length } });
        reportProgress?.(syncProgress("complete", `Encrypted backup saved at revision ${saved.revision}`));
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Automatic encrypted backup failed.";
        nextSchedules.set(schedule.id, markBackupScheduleFailure(schedule, reason, now));
        skipped += 1;
        messages.push(reason);
        await appendAndSaveSyncAuditEvent({ createdAt: now.toISOString(), operation: "backup-failed", scope: "schedule", deviceId: device.id, summary: "Automatic encrypted backup failed", metadata: { scheduleId: schedule.id, reason: "execution-error" } });
        await notifyBackupAttention(reason, schedule.id, "failure").catch(() => false);
        reportProgress?.(syncProgress("error", reason));
      }
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Automatic encrypted backup could not initialize.";
    for (const schedule of due) {
      nextSchedules.set(schedule.id, markBackupScheduleFailure(schedule, reason, now));
      skipped += 1;
      messages.push(reason);
    }
  }
  const resultSchedules = [...nextSchedules.values()];
  await saveBackupSchedules(resultSchedules);
  if (!completed && skipped) reportProgress?.(syncProgress("error", messages[0] ?? "Encrypted backup needs your attention"));
  return { attempted: due.length, completed, skipped, schedules: resultSchedules, messages };
}

export async function runEncryptedBackupNow(scheduleId?: string, now = new Date(), reportProgress?: BackupProgressReporter): Promise<BackupRunResult> {
  const schedules = await loadBackupSchedules();
  const eligible = schedules.filter((schedule) => schedule.enabled && (!scheduleId || schedule.id === scheduleId));
  if (!eligible.length) { reportProgress?.(syncProgress("error", "No active encrypted backup schedule is available")); return { attempted: 0, completed: 0, skipped: 0, schedules, messages: ["No active encrypted backup schedule is available for a quick run."] }; }
  const forced = schedules.map((schedule) => eligible.some((item) => item.id === schedule.id) ? { ...schedule, nextRunAt: now.toISOString() } : schedule);
  await saveBackupSchedules(forced);
  return runDueEncryptedBackups(now, reportProgress);
}
