import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { createDemoWorkspace, createEmptyWorkspace, isEmptyWorkspace, isSeededDemoWorkspace } from "../lib/workspace-state";

describe("first-run workspace state", () => {
  it("starts empty without demo concepts or relationships", () => {
    const workspace = createEmptyWorkspace();
    expect(isEmptyWorkspace(workspace)).toBe(true);
    expect(workspace.concepts).toHaveLength(0);
    expect(workspace.connections).toHaveLength(0);
  });

  it("loads the existing graph only when the demo workspace is requested", () => {
    const workspace = createDemoWorkspace();
    expect(workspace.concepts).toHaveLength(concepts.length);
    expect(workspace.connections).toHaveLength(connections.length);
    expect(isSeededDemoWorkspace(workspace)).toBe(true);
  });
});
