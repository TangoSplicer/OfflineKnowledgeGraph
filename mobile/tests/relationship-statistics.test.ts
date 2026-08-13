import { describe, expect, it } from "vitest";

import { connections } from "../lib/knowledge-data";
import { calculateRelationshipStatistics } from "../lib/relationship-statistics";

describe("relationship statistics", () => {
  it("calculates type, note, and average-strength summaries from live connections", () => {
    const stats = calculateRelationshipStatistics(connections);
    expect(stats.total).toBe(connections.length);
    expect(stats.noted).toBe(connections.length);
    expect(stats.byType.find((entry) => entry.type === "supports")?.count).toBe(1);
    expect(stats.averageStrength).toBe(4);
  });

  it("returns a complete five-level strength distribution including empty buckets", () => {
    const stats = calculateRelationshipStatistics(connections);
    expect(stats.byStrength).toHaveLength(5);
    expect(stats.byStrength.map((entry) => entry.strength)).toEqual([1, 2, 3, 4, 5]);
    expect(stats.byStrength.find((entry) => entry.strength === 2)?.count).toBe(0);
  });
});
