import { vi , describe, expect, it } from "vitest";


import { decryptCompleteGraph, encryptCompleteGraph, mergeGraphBackups, previewGraphSyncConflict, resolveGraphSyncConflict } from "../lib/encrypted-graph-sync";
import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length + 11) % 256)),
}));

describe("encrypted complete graph synchronization", () => {
  it("encrypts a complete graph into an opaque envelope and restores it only with the same passphrase", async () => {
    const graph = createGraphBackup(concepts, connections, "2026-08-15T12:00:00.000Z");
    const envelope = await encryptCompleteGraph(graph.concepts, graph.connections, "a secure complete graph passphrase");
    expect(envelope.ciphertext).not.toContain(graph.concepts[0].title);
    await expect(decryptCompleteGraph(JSON.stringify(envelope), "a secure complete graph passphrase")).resolves.toMatchObject({ concepts: graph.concepts, connections: graph.connections });
    await expect(decryptCompleteGraph(JSON.stringify(envelope), "a different secure passphrase")).rejects.toThrow("Unable to decrypt");
  });

  it("keeps merge, local, and remote complete-graph recovery choices explicit", () => {
    const local = createGraphBackup([{ ...concepts[0], title: "Local concept", updatedAt: "2026-08-10" }, concepts[1]], [connections[0]], "2026-08-10T00:00:00.000Z");
    const remote = createGraphBackup([{ ...concepts[0], title: "Remote concept", updatedAt: "2026-08-12" }, concepts[1], concepts[2]], [connections[0], connections[1]], "2026-08-12T00:00:00.000Z");
    const preview = previewGraphSyncConflict(local, remote);
    expect(preview).toMatchObject({ localConcepts: 2, remoteConcepts: 3, mergedConcepts: 3 });
    expect(mergeGraphBackups(local, remote).concepts.find((item) => item.id === concepts[0].id)?.title).toBe("Remote concept");
    expect(resolveGraphSyncConflict(local, remote, "local")).toEqual(local);
    expect(resolveGraphSyncConflict(local, remote, "remote")).toEqual(remote);
  });
});
