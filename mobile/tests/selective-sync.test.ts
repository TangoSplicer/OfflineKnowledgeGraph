import { vi, describe, expect, it } from "vitest";

import { createSelectedGraphBackup, mergeSelectedGraphBackups, previewSelectiveGraphSync } from "../lib/encrypted-graph-sync";
import { concepts, connections } from "../lib/knowledge-data";
import { createGraphBackup } from "../lib/relationship-backup";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length + 11) % 256)),
}));

describe("selective encrypted graph synchronization", () => {
  it("keeps only relationships whose endpoints are selected", () => {
    const graph = createGraphBackup(concepts, connections);
    const selected = createSelectedGraphBackup(graph, { conceptIds: [concepts[0].id, concepts[1].id] });
    expect(selected.concepts.map((concept) => concept.id)).toEqual([concepts[0].id, concepts[1].id]);
    expect(selected.connections.every((connection) => [concepts[0].id, concepts[1].id].includes(connection.sourceId) && [concepts[0].id, concepts[1].id].includes(connection.targetId))).toBe(true);
  });

  it("previews new and duplicate records before recovery", () => {
    const local = createGraphBackup([concepts[0]], []);
    const remote = createGraphBackup([concepts[0], concepts[1]], [connections[0]]);
    const preview = previewSelectiveGraphSync(local, remote, { conceptIds: [concepts[0].id, concepts[1].id] });
    expect(preview).toMatchObject({ selectedConcepts: 2, newConcepts: 1, selectedRelationships: 1, newRelationships: 1, duplicateConcepts: 1 });
  });

  it("merges a selected subset without replacing unrelated local concepts", () => {
    const local = createGraphBackup([concepts[0], concepts[2]], []);
    const remote = createGraphBackup([concepts[0], concepts[1]], [connections[0]]);
    const merged = mergeSelectedGraphBackups(local, remote, [concepts[0].id, concepts[1].id]);
    expect(merged.concepts.map((concept) => concept.id)).toEqual(expect.arrayContaining([concepts[0].id, concepts[1].id, concepts[2].id]));
    expect(merged.connections).toHaveLength(1);
  });
});
