import { describe, expect, it } from "vitest";

import { concepts, connections, sameConceptPair } from "../lib/knowledge-data";
import { suggestConnections } from "../lib/connection-suggestions";

describe("local connection suggestions", () => {
  it("proposes only currently unlinked concepts with explainable local reasons", () => {
    const suggestions = suggestConnections(concepts, connections);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.reasons.length > 0 && !connections.some((connection) => sameConceptPair(connection, suggestion.source.id, suggestion.target.id)))).toBe(true);
  });

  it("keeps strongest local overlaps first", () => {
    const suggestions = suggestConnections(concepts, connections);
    expect(suggestions.every((suggestion, index) => index === 0 || suggestions[index - 1].score >= suggestion.score)).toBe(true);
  });
});
