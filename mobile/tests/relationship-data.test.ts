import { describe, expect, it } from "vitest";

import {
  addConnection,
  connections,
  getConnectionsForConcept,
  removeConnection,
  updateConnection,
} from "../lib/knowledge-data";

describe("local relationship data", () => {
  it("exposes typed local relationships without self-links", () => {
    expect(connections.length).toBeGreaterThan(0);
    expect(connections.every((connection) => connection.sourceId !== connection.targetId)).toBe(true);
    expect(getConnectionsForConcept(connections, "adaptive-systems").map(({ otherConcept }) => otherConcept.id)).toContain("feedback-loops");
  });

  it("adds a new relationship once and prevents duplicate pairs", () => {
    const first = addConnection(connections, { sourceId: "cognitive-load", targetId: "donella-meadows", relationship: "supports", strength: 4 });
    expect(first).toHaveLength(connections.length + 1);
    expect(first.at(-1)).toMatchObject({ id: "cognitive-load-donella-meadows", strength: 4 });
    expect(addConnection(first, { sourceId: "donella-meadows", targetId: "cognitive-load", relationship: "explains", strength: 3 })).toBe(first);
  });

  it("updates strength safely and removes a selected relationship", () => {
    const updated = updateConnection(connections, "adaptive-feedback", { relationship: "explains", strength: 9 });
    expect(updated.find((connection) => connection.id === "adaptive-feedback")).toMatchObject({ relationship: "explains", strength: 5 });
    expect(removeConnection(updated, "adaptive-feedback").some((connection) => connection.id === "adaptive-feedback")).toBe(false);
  });

  it("persists local source context and evidence confidence on a relationship", () => {
    const updated = updateConnection(connections, "adaptive-feedback", { sourceAnnotation: "Observed in a system map.", sourceQuote: "Signals change behavior.", evidenceConfidence: 5 });
    expect(updated.find((connection) => connection.id === "adaptive-feedback")).toMatchObject({ sourceAnnotation: "Observed in a system map.", sourceQuote: "Signals change behavior.", evidenceConfidence: 5 });
  });
});
