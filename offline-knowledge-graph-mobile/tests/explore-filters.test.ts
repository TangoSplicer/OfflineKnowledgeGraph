import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { filterExploreConnections, matchingConceptIds, nearbyConceptsForQuery } from "../lib/explore-filters";

describe("Explore graph search and filters", () => {
  it("finds concepts across title, summary, and working note text", () => {
    expect(matchingConceptIds(concepts, "working memory")).toContain("cognitive-load");
    expect(matchingConceptIds(concepts, "adaptive")).toContain("adaptive-systems");
  });

  it("filters relationships by note signal and relationship type", () => {
    expect(filterExploreConnections(connections, "noted", "all")).toHaveLength(connections.length);
    expect(filterExploreConnections(connections, "strong", "all").map((connection) => connection.id)).toEqual(["adaptive-feedback", "adaptive-boundaries", "meadows-adaptive"]);
    expect(filterExploreConnections(connections, "all", "challenges").map((connection) => connection.id)).toEqual(["feedback-cognitive"]);
  });

  it("narrows nearby concepts to the current concept query and visible relationships", () => {
    expect(nearbyConceptsForQuery(concepts, connections, "feedback").map((concept) => concept.id)).toContain("feedback-loops");
    expect(nearbyConceptsForQuery(concepts, connections, "no matching concept")).toHaveLength(0);
  });
});
