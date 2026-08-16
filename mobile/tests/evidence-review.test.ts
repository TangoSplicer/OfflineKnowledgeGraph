import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { evidenceReviewItems, evidenceReviewSummary } from "../lib/evidence-review";

describe("evidence review", () => {
  it("flags links that need local evidence context", () => {
    const items = evidenceReviewItems(concepts, connections);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("flags");
  });

  it("summarizes the evidence workload deterministically", () => {
    const summary = evidenceReviewSummary(concepts, connections);
    expect(summary.total).toBe(connections.length);
    expect(summary.attention).toBeGreaterThanOrEqual(summary.weak);
  });
});
