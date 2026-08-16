import { vi , describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";
import { createAdjacentEncryptedBundle, decryptAdjacentEncryptedBundle, parseAdjacentEncryptedBundle } from "../lib/adjacent-bundle-transfer";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + 19) % 256)),
  randomUUID: vi.fn(() => "adjacent-bundle-nonce"),
}));

describe("adjacent encrypted backup bundles", () => {
  it("keeps graph data opaque and restores it with the shared passphrase", async () => {
    const graph = createGraphBackup(concepts.slice(0, 2), connections.slice(0, 1), "2026-08-16T00:00:00.000Z");
    const raw = await createAdjacentEncryptedBundle(graph, "a nearby transfer passphrase", "device-a", "Research phone", 1000);
    expect(raw).not.toContain(graph.concepts[0].title);
    const used = new Set<string>();
    await expect(decryptAdjacentEncryptedBundle(raw, "a nearby transfer passphrase", used, 1001)).resolves.toMatchObject({ payload: { senderLabel: "Research phone", conceptCount: 2 }, graph: { schemaVersion: graph.schemaVersion, concepts: graph.concepts, connections: graph.connections } });
    expect(used).toContain("adjacent-bundle-nonce");
  });

  it("rejects expired bundles and replayed nonces", async () => {
    const graph = createGraphBackup(concepts.slice(0, 1), [], "2026-08-16T00:00:00.000Z");
    const raw = await createAdjacentEncryptedBundle(graph, "a nearby transfer passphrase", "device-a", "Research phone", 1000);
    const used = new Set(["adjacent-bundle-nonce"]);
    await expect(decryptAdjacentEncryptedBundle(raw, "a nearby transfer passphrase", used, 1001)).rejects.toThrow("already been imported");
    expect(() => parseAdjacentEncryptedBundle(raw, 181_001)).toThrow("expired");
  });
});
