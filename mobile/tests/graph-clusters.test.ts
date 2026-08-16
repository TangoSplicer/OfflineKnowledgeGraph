import { describe, expect, it } from "vitest";

import { buildTagClusters, clusterByTag } from "../lib/graph-clusters";
import { concepts, connections } from "../lib/knowledge-data";

describe("tag-based graph clusters", () => {
  it("groups concepts by tag and distinguishes internal links from bridges", () => {
    const systems = clusterByTag(concepts, connections, "systems");
    expect(systems?.concepts.map((concept) => concept.id)).toEqual(expect.arrayContaining(["adaptive-systems", "feedback-loops", "donella-meadows"]));
    expect(systems?.internalConnections.map((connection) => connection.id)).toEqual(expect.arrayContaining(["adaptive-feedback", "meadows-adaptive"]));
    expect(systems?.bridgeConnections.map((connection) => connection.id)).toContain("adaptive-boundaries");
  });

  it("orders larger clusters before smaller clusters", () => {
    expect(buildTagClusters(concepts, connections)[0]?.tag).toBe("systems");
  });
});
