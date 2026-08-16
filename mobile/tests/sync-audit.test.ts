import { createHash } from "node:crypto";
import { vi, describe, expect, it } from "vitest";

import { appendSyncAuditEvent, createEmptySyncAuditLedger, mergeSyncAuditLedgers, verifySyncAuditLedger } from "../lib/sync-audit";

vi.mock("expo-crypto", () => ({
  randomUUID: vi.fn(() => "audit-test-id"),
  digestStringAsync: vi.fn(async (_algorithm: string, value: string) => createHash("sha256").update(value).digest("hex")),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

describe("tamper-evident sync audit history", () => {
  it("chains events to the previous digest and verifies the chain", async () => {
    let ledger = createEmptySyncAuditLedger();
    ledger = await appendSyncAuditEvent(ledger, { createdAt: "2026-08-16T10:00:00.000Z", operation: "graph-uploaded", scope: "complete-graph", summary: "Uploaded graph", metadata: { concepts: 3 } });
    ledger = await appendSyncAuditEvent(ledger, { createdAt: "2026-08-16T10:01:00.000Z", operation: "graph-downloaded", scope: "complete-graph", summary: "Downloaded graph", metadata: { concepts: 3 } });
    expect(ledger.events[0].previousDigest).toBe("GENESIS");
    expect(ledger.events[1].previousDigest).toBe(ledger.events[0].digest);
    await expect(verifySyncAuditLedger(ledger)).resolves.toBe(true);
  });

  it("rejects changed event content and broken links", async () => {
    let ledger = createEmptySyncAuditLedger();
    ledger = await appendSyncAuditEvent(ledger, { createdAt: "2026-08-16T10:00:00.000Z", operation: "backup-executed", scope: "schedule", summary: "Backup", metadata: { revision: 1 } });
    const tampered = { ...ledger, events: [{ ...ledger.events[0], summary: "Changed after the fact" }] };
    await expect(verifySyncAuditLedger(tampered)).resolves.toBe(false);
    const broken = { ...ledger, events: [{ ...ledger.events[0], previousDigest: "wrong" }] };
    await expect(verifySyncAuditLedger(broken)).resolves.toBe(false);
  });

  it("merges only verified events and re-chains the result", async () => {
    let local = createEmptySyncAuditLedger();
    local = await appendSyncAuditEvent(local, { id: "local", createdAt: "2026-08-16T10:00:00.000Z", operation: "device-trusted", scope: "trusted-device", summary: "Trusted", metadata: {} });
    let remote = createEmptySyncAuditLedger();
    remote = await appendSyncAuditEvent(remote, { id: "remote", createdAt: "2026-08-16T10:02:00.000Z", operation: "graph-uploaded", scope: "complete-graph", summary: "Uploaded", metadata: {} });
    const merged = await mergeSyncAuditLedgers(local, remote);
    expect(merged.events.map((event) => event.id)).toEqual(["local", "remote"]);
    await expect(verifySyncAuditLedger(merged)).resolves.toBe(true);
    await expect(mergeSyncAuditLedgers({ ...local, events: [{ ...local.events[0], summary: "tampered" }] }, remote)).rejects.toThrow("integrity verification");
  });
});
