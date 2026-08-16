import { describe, expect, it, vi } from "vitest";

import { createPairingQrModules, parseDevicePairingPayload } from "../lib/qr-pairing";
import { consumeAdjacentPairingToken, createAdjacentPairingToken } from "../lib/adjacent-pairing";
import { compareSnapshotWithLocal } from "../lib/snapshot-diff";
import { summarizeBackupSchedules } from "../lib/backup-status";
import type { GraphBackup } from "../lib/relationship-backup";
import type { BackupSchedule } from "../lib/backup-schedules";

vi.mock("expo-crypto", () => ({ randomUUID: vi.fn(() => "device-test") }));
vi.mock("expo-secure-store", () => ({ getItemAsync: vi.fn(async () => null), setItemAsync: vi.fn(async () => undefined) }));
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

const concept = (id: string, title: string, summary: string, kind: "Theory" | "Question" | "Method") => ({ id, title, kind, summary, note: "", updatedAt: "2026-08-16T00:00:00.000Z", backlinks: 0, color: "#ffffff", tags: [], sourceUrls: [], sourceAnnotation: "", sourceQuote: "" });
const connection = (id: string, sourceId: string, targetId: string, relationship: "supports" | "explains") => ({ id, sourceId, targetId, relationship, strength: 3, note: "", sourceUrls: [], sourceAnnotation: "", sourceQuote: "", evidenceConfidence: 3 });

const baseGraph: GraphBackup = {
  schemaVersion: 2,
  exportedAt: "2026-08-16T00:00:00.000Z",
  concepts: [concept("a", "Alpha", "one", "Theory"), concept("b", "Beta", "two", "Question")],
  connections: [connection("ab", "a", "b", "supports")],
};

describe("QR pairing and snapshot/dashboard helpers", () => {
  it("renders a non-empty square QR matrix and validates its scope", () => {
    const raw = JSON.stringify({ schemaVersion: 1, scope: "trusted-device-pairing", deviceId: "device-a", label: "Phone", platform: "android", createdAt: "2026-08-16T00:00:00.000Z" });
    const modules = createPairingQrModules(raw);
    expect(modules.length).toBeGreaterThan(20);
    expect(modules.every((row) => row.length === modules.length)).toBe(true);
    expect(parseDevicePairingPayload(raw).deviceId).toBe("device-a");
  });

  it("rejects non-pairing QR payloads", () => {
    expect(() => parseDevicePairingPayload(JSON.stringify({ scope: "graph-data" }))).toThrow(/not a compatible/i);
  });

  it("expires and rejects replayed adjacent pairing tokens", () => {
    const raw = createAdjacentPairingToken("device-b", "Nearby tablet", "android", "bluetooth", 1_000);
    const used = new Set<string>();
    const token = consumeAdjacentPairingToken(raw, used, 1_001);
    expect(token.transport).toBe("bluetooth");
    expect(() => consumeAdjacentPairingToken(raw, used, 1_002)).toThrow(/already been used/i);
    expect(() => consumeAdjacentPairingToken(raw, new Set<string>(), 121_001)).toThrow(/expired/i);
  });

  it("reports concept and relationship changes after local decryption", () => {
    const snapshot: GraphBackup = {
      ...baseGraph,
      concepts: [concept("a", "Alpha", "updated", "Theory"), concept("b", "Beta", "two", "Question"), concept("c", "Gamma", "three", "Method")],
      connections: [...baseGraph.connections, connection("bc", "b", "c", "explains")],
    };
    const diff = compareSnapshotWithLocal(baseGraph, snapshot);
    expect(diff.modifiedConceptIds).toEqual(["a"]);
    expect(diff.newConceptIds).toEqual(["c"]);
    expect(diff.newConnectionIds).toEqual(["bc"]);
    expect(diff.removedConceptIds).toEqual([]);
  });

  it("surfaces the next active backup and previous errors", () => {
    const schedules: BackupSchedule[] = [{ id: "daily", enabled: true, frequency: "daily", hourUTC: 12, weekdayUTC: 1, createdAt: "2026-08-15T00:00:00.000Z", updatedAt: "2026-08-15T00:00:00.000Z", nextRunAt: "2026-08-16T12:00:00.000Z", lastError: "Revision conflict" }];
    const summary = summarizeBackupSchedules(schedules, new Date("2026-08-16T10:00:00.000Z"));
    expect(summary.activeCount).toBe(1);
    expect(summary.nextRunLabel).toContain("in 2h");
    expect(summary.attention).toBe(true);
    expect(summary.attentionLabel).toBe("Revision conflict");
  });
});
