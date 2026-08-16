import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { maintenanceCues } from "../lib/maintenance-review";

describe("local maintenance review", () => {
  it("creates actionable cues from current evidence and graph structure", () => {
    const cues = maintenanceCues(concepts, connections);
    expect(cues.length).toBeGreaterThan(0);
    expect(cues.every((cue) => cue.title && cue.detail)).toBe(true);
  });
});
