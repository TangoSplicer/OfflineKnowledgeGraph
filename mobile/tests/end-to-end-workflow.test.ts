import { vi, describe, it, expect } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";
import { encryptCompleteGraph, decryptCompleteGraph, previewGraphSyncConflict, resolveGraphSyncConflict } from "../lib/encrypted-graph-sync";
import { appendSyncAuditEvent, verifySyncAuditLedger } from "../lib/sync-audit";
import { createBackupSchedule, isBackupScheduleDue } from "../lib/backup-schedules";
import { restoreEncryptedSnapshot } from "../lib/encrypted-snapshots";
import { createAdjacentEncryptedBundle, decryptAdjacentEncryptedBundle } from "../lib/adjacent-bundle-transfer";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + 47) % 256)),
  randomUUID: vi.fn(() => "e2e-test-uuid"),
  digestStringAsync: vi.fn(async (_algo: string, data: string) => `sha256-${data.slice(0, 16)}`),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

describe("comprehensive end-to-end workflow test", () => {
  it("successfully executes the complete graph lifecycle, encryption, audit trail, backup schedule, and snapshot rollback", async () => {
    // 1. Initialize local graph backup from canonical data
    // Pick concept IDs that match connections[0] (e.g. adaptive-systems and feedback-loops)
    const testConcepts = concepts.slice(0, 3);
    const testConceptIds = new Set(testConcepts.map(c => c.id));
    const testConnections = connections.filter(conn => testConceptIds.has(conn.sourceId) && testConceptIds.has(conn.targetId));
    const localGraph = createGraphBackup(testConcepts, testConnections, "2026-08-16T12:00:00.000Z");
    expect(localGraph.concepts).toHaveLength(3);
    expect(localGraph.connections).toHaveLength(2);

    // 2. Encrypt complete graph envelope (end-to-end zero-knowledge storage simulation)
    const passphrase = "secure-end-to-end-passphrase-12345";
    const envelope = await encryptCompleteGraph(localGraph.concepts, localGraph.connections, passphrase);
    expect(envelope.ciphertext).toBeDefined();

    // 3. Restore and decrypt envelope
    const restored = await decryptCompleteGraph(JSON.stringify(envelope), passphrase);
    expect(restored.concepts).toHaveLength(3);
    expect(restored.connections).toHaveLength(2);

    // 4. Test conflict preview and resolution
    const remoteGraph = createGraphBackup([
      ...localGraph.concepts.slice(0, 2),
      { ...localGraph.concepts[2], title: "Remote Updated Concept" }
    ], localGraph.connections, "2026-08-16T13:00:00.000Z");

    const conflictPreview = previewGraphSyncConflict(localGraph, remoteGraph);
    expect(conflictPreview.remoteConcepts).toBe(3);

    const merged = resolveGraphSyncConflict(localGraph, remoteGraph, "merge");
    expect(merged.concepts.find(c => c.id === localGraph.concepts[2].id)?.title).toBe(localGraph.concepts[2].title);

    // 5. Tamper-evident sync audit ledger
    let ledger: import("../lib/sync-audit").SyncAuditLedger = { schemaVersion: 1, events: [] };
    ledger = await appendSyncAuditEvent(ledger, {
      createdAt: new Date().toISOString(),
      operation: "graph-uploaded",
      scope: "complete-graph",
      summary: "Uploaded complete graph",
      metadata: { conceptCount: 3 },
    });
    ledger = await appendSyncAuditEvent(ledger, {
      createdAt: new Date().toISOString(),
      operation: "backup-executed",
      scope: "schedule",
      summary: "Executed backup schedule",
      metadata: { scheduleId: "sched-1" },
    });
    const isValidLedger = await verifySyncAuditLedger(ledger);
    expect(isValidLedger).toBe(true);
    expect(ledger.events).toHaveLength(2);

    // 6. Automatic backup schedule validation
    const schedule = createBackupSchedule({
      id: "sched-1",
      enabled: true,
      frequency: "daily",
      hourUTC: 2,
      weekdayUTC: 0,
      now: new Date("2026-08-16T01:00:00.000Z"),
    });
    expect(schedule.nextRunAt).toBe("2026-08-16T02:00:00.000Z");
    expect(isBackupScheduleDue(schedule, new Date("2026-08-16T03:00:00.000Z"))).toBe(true);

    // 7. Encrypted snapshots and restore
    const snapshotItem = {
      id: "snapshot-test",
      createdAt: new Date().toISOString(),
      label: "Daily Backup",
      conceptCount: localGraph.concepts.length,
      relationshipCount: localGraph.connections.length,
      envelope: JSON.stringify(envelope),
    };
    const restoredSnapshot = await restoreEncryptedSnapshot(snapshotItem, passphrase);
    expect(restoredSnapshot.concepts).toHaveLength(3);

    // 8. Adjacent encrypted bundle sharing
    const bundleRaw = await createAdjacentEncryptedBundle(localGraph, passphrase, "device-a", "Peer Device", Date.now());
    const usedNonces = new Set<string>();
    const decryptedBundle = await decryptAdjacentEncryptedBundle(bundleRaw, passphrase, usedNonces, Date.now());
    expect(decryptedBundle.graph.concepts).toHaveLength(3);
  });
});
