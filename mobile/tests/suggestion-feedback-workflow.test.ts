import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { suggestConnections } from "../lib/connection-suggestions";
import { appendSuggestionFeedback, emptySuggestionFeedback, isSuggestionDismissed, rankingSensitivity } from "../lib/suggestion-feedback";

describe("connection-suggestion review workflow", () => {
  it("supports the screen-level sequence of previewing, dismissing with a reason, and filtering the dismissed candidate", () => {
    const candidate = suggestConnections(concepts, connections)[0];
    const preview = rankingSensitivity(emptySuggestionFeedback(), candidate.signals, "dismissed");
    const afterDismissal = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: candidate.id, outcome: "dismissed", signals: candidate.signals, reason: "insufficient-evidence", label: `${candidate.source.title} ↔ ${candidate.target.title}` }, 100);
    const visibleCandidates = suggestConnections(concepts, connections, afterDismissal).filter((item) => !isSuggestionDismissed(afterDismissal, item.id));
    expect(preview.change).toBeLessThan(0);
    expect(visibleCandidates.some((item) => item.id === candidate.id)).toBe(false);
    expect(afterDismissal.events[0]).toMatchObject({ reason: "insufficient-evidence", createdAt: 100 });
  });
});
