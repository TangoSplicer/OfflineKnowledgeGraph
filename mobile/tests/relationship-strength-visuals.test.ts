import { describe, expect, it } from "vitest";

import { edgeOpacity, edgeStrokeWidth, strengthLabel } from "../lib/relationship-strength-visuals";

describe("relationship strength visuals", () => {
  it("increases visible edge weight and opacity as relationship strength increases", () => {
    expect(edgeStrokeWidth(5)).toBeGreaterThan(edgeStrokeWidth(1));
    expect(edgeOpacity(5)).toBeGreaterThan(edgeOpacity(1));
    expect(edgeStrokeWidth(3, true)).toBeGreaterThan(edgeStrokeWidth(3, false));
  });

  it("clamps visual values and provides accessible strength labels", () => {
    expect(edgeStrokeWidth(0)).toBe(edgeStrokeWidth(1));
    expect(edgeOpacity(10)).toBe(edgeOpacity(5));
    expect(strengthLabel(4)).toBe("4/5 strength");
  });
});
