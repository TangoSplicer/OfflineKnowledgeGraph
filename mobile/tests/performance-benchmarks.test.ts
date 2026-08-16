import { describe, expect, it, vi } from "vitest";

import { encryptCompleteGraph } from "../lib/encrypted-graph-sync";
import { filterExploreConnections } from "../lib/explore-filters";
import { graphPositionFor, graphLayouts } from "../lib/graph-layouts";
import { relationshipTypes, type Concept, type Connection } from "../lib/knowledge-data";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index * 17 + length + 23) % 256)),
}));

const benchmarkPassphrase = "performance benchmark passphrase";
const conceptKinds = ["Theory", "Method", "Evidence", "Question", "Person"] as const;

function createLargeGraph(size: number): { concepts: Concept[]; connections: Connection[] } {
  const concepts = Array.from({ length: size }, (_, index): Concept => ({
    id: `benchmark-concept-${index}`,
    title: `Benchmark concept ${index}`,
    kind: conceptKinds[index % conceptKinds.length],
    summary: `A deterministic summary for large-graph benchmark concept ${index}.`,
    note: index % 3 === 0 ? `A documented working note for concept ${index}.` : "",
    updatedAt: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
    backlinks: 6,
    color: ["#7C6CFF", "#48D6E8", "#FFB86B", "#63D2A3", "#F09BB4"][index % 5],
    tags: [`topic-${index % 12}`, `cluster-${index % 5}`],
    sourceUrls: [],
  }));
  const connections: Connection[] = [];
  for (let sourceIndex = 0; sourceIndex < size; sourceIndex += 1) {
    for (let offset = 1; offset <= 6; offset += 1) {
      const targetIndex = (sourceIndex + offset) % size;
      connections.push({
        id: `benchmark-relationship-${sourceIndex}-${targetIndex}`,
        sourceId: concepts[sourceIndex].id,
        targetId: concepts[targetIndex].id,
        relationship: relationshipTypes[(sourceIndex + offset) % relationshipTypes.length],
        strength: ((sourceIndex + offset) % 5) + 1,
        note: (sourceIndex + offset) % 3 === 0 ? `Dense graph note ${sourceIndex}-${targetIndex}` : "",
        sourceUrls: [],
        evidenceConfidence: ((sourceIndex + offset) % 5) + 1,
      });
    }
  }
  return { concepts, connections };
}

function elapsedMilliseconds(work: () => void): number {
  const startedAt = performance.now();
  work();
  return performance.now() - startedAt;
}

describe("large-graph performance regression checks", () => {
  it("encrypts deterministic 100, 500, and 1,000 concept graphs within device-friendly limits", async () => {
    const cases = [
      { concepts: 100, maximumMilliseconds: 3_000 },
      { concepts: 500, maximumMilliseconds: 5_000 },
      { concepts: 1_000, maximumMilliseconds: 8_000 },
    ];

    for (const scenario of cases) {
      const graph = createLargeGraph(scenario.concepts);
      const startedAt = performance.now();
      const envelope = await encryptCompleteGraph(graph.concepts, graph.connections, benchmarkPassphrase);
      const elapsed = performance.now() - startedAt;

      expect(envelope.ciphertext).not.toContain(graph.concepts[0].title);
      expect(elapsed).toBeLessThan(scenario.maximumMilliseconds);
      console.info(`[benchmark] encrypt ${scenario.concepts} concepts / ${graph.connections.length} relationships: ${elapsed.toFixed(1)}ms`);
    }
  }, 20_000);

  it("prepares positions for 1,000 concepts across all supported layouts without blocking the frame budget", () => {
    const graph = createLargeGraph(1_000);
    for (const layout of graphLayouts) {
      let positions: ReturnType<typeof graphPositionFor>[] = [];
      const elapsed = elapsedMilliseconds(() => {
        positions = graph.concepts.map((concept, index) => graphPositionFor(concept.id, index, graph.concepts.length, layout.id));
      });

      expect(positions).toHaveLength(1_000);
      expect(positions.every((position) => position.x >= 0 && position.x <= 1 && position.y >= 0 && position.y <= 1)).toBe(true);
      expect(elapsed).toBeLessThan(150);
      console.info(`[benchmark] ${layout.id} layout 1,000 concepts: ${elapsed.toFixed(1)}ms`);
    }
  });

  it("filters a dense 6,000-relationship graph quickly while retaining deterministic result sets", () => {
    const { connections } = createLargeGraph(1_000);
    let noted: Connection[] = [];
    let strong: Connection[] = [];
    let supporting: Connection[] = [];
    const elapsed = elapsedMilliseconds(() => {
      noted = filterExploreConnections(connections, "noted", "all");
      strong = filterExploreConnections(connections, "strong", "all");
      supporting = filterExploreConnections(connections, "all", "supports");
    });

    expect(connections).toHaveLength(6_000);
    expect(noted).toHaveLength(2_000);
    expect(strong).toHaveLength(2_400);
    expect(supporting).toHaveLength(1_200);
    expect(elapsed).toBeLessThan(500);
    console.info(`[benchmark] three dense filters across 6,000 relationships: ${elapsed.toFixed(1)}ms`);
  });
});
