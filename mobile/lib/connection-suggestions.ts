import type { Concept, Connection, RelationshipType } from "./knowledge-data";
import { sameConceptPair } from "./knowledge-data";
import { feedbackDelta, type SuggestionFeedback, type SuggestionSignal } from "./suggestion-feedback";

export type ConnectionSuggestion = { id: string; source: Concept; target: Concept; baseScore: number; feedbackDelta: number; score: number; reasons: string[]; signals: SuggestionSignal[]; suggestedRelationship: RelationshipType; suggestedStrength: number };

function connectedIds(connections: Connection[], conceptId: string) {
  return new Set(connections.flatMap((connection) => connection.sourceId === conceptId ? [connection.targetId] : connection.targetId === conceptId ? [connection.sourceId] : []));
}

export function suggestConnections(concepts: Concept[], connections: Connection[], feedback?: SuggestionFeedback, limit = 8): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = [];
  for (let leftIndex = 0; leftIndex < concepts.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < concepts.length; rightIndex += 1) {
      const source = concepts[leftIndex]; const target = concepts[rightIndex];
      if (connections.some((connection) => sameConceptPair(connection, source.id, target.id))) continue;
      const sharedTags = source.tags.filter((tag) => target.tags.includes(tag));
      const sourceLinks = source.sourceUrls.filter((url) => target.sourceUrls.includes(url));
      const sharedNeighbors = [...connectedIds(connections, source.id)].filter((id) => connectedIds(connections, target.id).has(id));
      const reasons: string[] = [];
      const signals: SuggestionSignal[] = [];
      let score = 0;
      if (sharedTags.length) { score += sharedTags.length * 2; signals.push("shared-tags"); reasons.push(`Shared tag${sharedTags.length === 1 ? "" : "s"}: #${sharedTags.join(" #")}`); }
      if (sharedNeighbors.length) { score += sharedNeighbors.length * 2; signals.push("shared-neighbors"); reasons.push(`${sharedNeighbors.length} shared graph neighbor${sharedNeighbors.length === 1 ? "" : "s"}`); }
      if (sourceLinks.length) { score += sourceLinks.length * 3; signals.push("shared-source"); reasons.push("Shared source reference"); }
      if (source.kind === target.kind) { score += 1; signals.push("same-kind"); reasons.push(`Both are ${source.kind.toLowerCase()} concepts`); }
      if (score < 2) continue;
      const adjustedByFeedback = feedbackDelta(feedback, signals);
      if (adjustedByFeedback) reasons.push(`${adjustedByFeedback > 0 ? "Feedback boost" : "Feedback reduction"}: ${adjustedByFeedback > 0 ? "+" : ""}${adjustedByFeedback.toFixed(2)}`);
      suggestions.push({ id: `suggestion-${source.id}-${target.id}`, source, target, baseScore: score, feedbackDelta: adjustedByFeedback, score: Math.max(0, score + adjustedByFeedback), reasons, signals, suggestedRelationship: sharedNeighbors.length ? "explains" : sharedTags.length ? "supports" : "exemplifies", suggestedStrength: Math.min(3, Math.max(1, Math.ceil(score / 2))) });
    }
  }
  return suggestions.sort((left, right) => right.score - left.score || left.source.title.localeCompare(right.source.title) || left.target.title.localeCompare(right.target.title)).slice(0, limit);
}
