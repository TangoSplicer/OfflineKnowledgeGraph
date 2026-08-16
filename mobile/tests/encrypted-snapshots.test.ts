import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";
import { clearEncryptedSnapshots, loadEncryptedSnapshots, MAX_RETAINED_SNAPSHOTS, restoreEncryptedSnapshot, saveEncryptedSnapshot } from "../lib/encrypted-snapshots";

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { storage.delete(key); }),
  },
}));
vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length + 11) % 256)),
}));

describe("encrypted snapshot history", () => {
  beforeEach(async () => { storage.clear(); await clearEncryptedSnapshots(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("retains only the newest bounded encrypted snapshots", async () => {
    const graph = createGraphBackup(concepts.slice(0, 1), []);
    for (let index = 0; index < MAX_RETAINED_SNAPSHOTS + 2; index += 1) {
      vi.spyOn(Date, "now").mockReturnValueOnce(1_700_000_000_000 + index);
      await saveEncryptedSnapshot(graph, "a secure snapshot passphrase", `Snapshot ${index}`);
    }
    const snapshots = await loadEncryptedSnapshots();
    expect(snapshots).toHaveLength(MAX_RETAINED_SNAPSHOTS);
    expect(snapshots[0].label).toBe(`Snapshot ${MAX_RETAINED_SNAPSHOTS + 1}`);
    expect(snapshots[0].envelope).not.toContain(concepts[0].title);
  });

  it("restores a snapshot only with the original passphrase", async () => {
    const graph = createGraphBackup(concepts.slice(0, 2), connections.slice(0, 1));
    const snapshots = await saveEncryptedSnapshot(graph, "a secure snapshot passphrase", "Before migration");
    await expect(restoreEncryptedSnapshot(snapshots[0], "a secure snapshot passphrase")).resolves.toMatchObject({ concepts: graph.concepts, connections: graph.connections });
    await expect(restoreEncryptedSnapshot(snapshots[0], "another snapshot passphrase")).rejects.toThrow("Unable to decrypt");
  });
});
