import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { buildGraphSvg } from "../lib/graph-export";

describe("filtered graph image export", () => {
  it("creates a shareable SVG containing the filtered graph and note metadata", () => {
    const svg = buildGraphSvg(concepts, [connections[0]], { title: "Current Explore View", subtitle: "2 concepts · 1 relationship" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("Current Explore View");
    expect(svg).toContain("Feedback signals help the system decide");
    expect(svg).toContain('data-relationship="depends on"');
    expect(svg).toContain('data-concept-id="adaptive-systems"');
  });
});
