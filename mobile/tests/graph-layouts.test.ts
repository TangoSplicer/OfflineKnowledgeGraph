import { describe, expect, it } from "vitest";

import { graphLayouts, graphPositionFor } from "../lib/graph-layouts";

describe("graph layouts", () => {
  it("offers balanced, radial, and grid layouts", () => {
    expect(graphLayouts.map((layout) => layout.id)).toEqual(["balanced", "radial", "grid"]);
  });

  it("keeps every computed position inside the graph canvas bounds", () => {
    (["balanced", "radial", "grid"] as const).forEach((layout) => {
      Array.from({ length: 7 }, (_, index) => graphPositionFor(`concept-${index}`, index, 7, layout)).forEach((position) => {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(1);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThanOrEqual(1);
      });
    });
  });
});
