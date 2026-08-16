import { describe, expect, it } from "vitest";

import { concepts, connections } from "../lib/knowledge-data";
import { suggestConnections } from "../lib/connection-suggestions";
import { appendSuggestionFeedback, createFeedbackProfileBundle, emptySuggestionFeedback, feedbackSummary, feedbackTimeline, isSuggestionDismissed, mergeSuggestionFeedback, parseFeedbackProfile, previewFeedbackImport, rankingSensitivity, serializeFeedbackProfile, signalRecommendations, signalWeights, updateFeedbackReason } from "../lib/suggestion-feedback";

describe("connection suggestion feedback", () => {
  it("keeps one current local feedback outcome per suggestion", () => {
    const accepted = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-tags"] }, 1);
    const replaced = appendSuggestionFeedback(accepted, { suggestionId: "candidate-a", outcome: "dismissed", signals: ["shared-tags", "same-kind"] }, 2);
    expect(replaced.events).toEqual([expect.objectContaining({ suggestionId: "candidate-a", outcome: "dismissed", createdAt: 2 })]);
  });

  it("exposes bounded positive and negative weights by local signal", () => {
    const feedback = appendSuggestionFeedback(appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "a", outcome: "accepted", signals: ["shared-tags"] }, 1), { suggestionId: "b", outcome: "dismissed", signals: ["same-kind"] }, 2);
    expect(signalWeights(feedback)["shared-tags"]).toBeGreaterThan(0);
    expect(signalWeights(feedback)["same-kind"]).toBeLessThan(0);
    expect(feedbackSummary(feedback)).toMatchObject({ accepted: 1, dismissed: 1, adjustedSignals: 2 });
  });

  it("applies feedback as a visible ranking adjustment", () => {
    const baseline = suggestConnections(concepts, connections);
    const candidate = baseline[0];
    const feedback = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: candidate.id, outcome: "accepted", signals: candidate.signals }, 1);
    const adjusted = suggestConnections(concepts, connections, feedback).find((item) => item.id === candidate.id)!;
    expect(adjusted.feedbackDelta).toBeGreaterThan(0);
    expect(adjusted.score).toBeGreaterThan(adjusted.baseScore);
  });

  it("preserves a user-selected reason in newest-first feedback history", () => {
    const accepted = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-source"], reason: "useful-evidence", label: "Adaptive Systems ↔ Evidence" }, 1);
    const dismissed = appendSuggestionFeedback(accepted, { suggestionId: "candidate-b", outcome: "dismissed", signals: ["same-kind"], reason: "wrong-relationship", label: "Two theories" }, 2);
    expect(feedbackTimeline(dismissed)).toEqual([expect.objectContaining({ suggestionId: "candidate-b", reason: "wrong-relationship" }), expect.objectContaining({ suggestionId: "candidate-a", reason: "useful-evidence" })]);
  });

  it("models the visible dismiss and reset workflow without hiding the feedback state", () => {
    const feedback = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "dismissed", signals: ["shared-tags"], reason: "not-relevant" }, 1);
    expect(isSuggestionDismissed(feedback, "candidate-a")).toBe(true);
    expect(isSuggestionDismissed(emptySuggestionFeedback(), "candidate-a")).toBe(false);
  });

  it("previews a deterministic signal shift before an outcome is committed", () => {
    const feedback = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-tags"] }, 1);
    const acceptedPreview = rankingSensitivity(feedback, ["shared-tags"], "accepted");
    const dismissedPreview = rankingSensitivity(feedback, ["shared-tags"], "dismissed");
    expect(acceptedPreview.change).toBeGreaterThan(0);
    expect(dismissedPreview.change).toBeLessThan(0);
  });

  it("updates a recorded outcome reason without changing its ranking signals", () => {
    const feedback = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-source"], reason: "matches-judgment" }, 1);
    const edited = updateFeedbackReason(feedback, "candidate-a", "useful-evidence");
    expect(edited.events[0]).toMatchObject({ reason: "useful-evidence", signals: ["shared-source"] });
  });

  it("creates explainable recommendations only after recurring local outcomes", () => {
    let feedback = emptySuggestionFeedback();
    feedback = appendSuggestionFeedback(feedback, { suggestionId: "a", outcome: "accepted", signals: ["shared-tags"] }, 1);
    feedback = appendSuggestionFeedback(feedback, { suggestionId: "b", outcome: "accepted", signals: ["shared-tags"] }, 2);
    expect(signalRecommendations(feedback)).toEqual(expect.arrayContaining([expect.objectContaining({ signal: "shared-tags", tone: "reinforce" })]));
  });

  it("serializes, validates, previews, and merges portable feedback profiles safely", () => {
    const current = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "current", outcome: "accepted", signals: ["shared-tags"] }, 1);
    const incoming = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "current", outcome: "dismissed", signals: ["same-kind"] }, 2);
    const parsed = parseFeedbackProfile(serializeFeedbackProfile(incoming, "2026-01-01T00:00:00.000Z"));
    expect(createFeedbackProfileBundle(incoming, "2026-01-01T00:00:00.000Z").feedback).toEqual(incoming);
    expect(previewFeedbackImport(current, parsed.feedback)).toMatchObject({ incomingEvents: 1, newerReplacements: 1 });
    expect(mergeSuggestionFeedback(current, parsed.feedback).events).toEqual([expect.objectContaining({ outcome: "dismissed", createdAt: 2 })]);
    expect(() => parseFeedbackProfile("{}")).toThrow("compatible feedback profile");
  });
});
