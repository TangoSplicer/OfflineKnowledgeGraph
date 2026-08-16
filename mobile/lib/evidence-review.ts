import type { Concept, Connection } from "./knowledge-data";
import { clampEvidenceConfidence, evidenceConfidenceLabel } from "./relationship-evidence";

export type EvidenceReviewFilter = "all" | "weak" | "uncited" | "unquoted";
export type EvidenceReviewItem = { connection: Connection; source: Concept; target: Concept; flags: string[]; confidenceLabel: string };

export function evidenceReviewItems(concepts: Concept[], connections: Connection[], filter: EvidenceReviewFilter = "all"): EvidenceReviewItem[] {
  const byId = new Map(concepts.map((concept) => [concept.id, concept]));
  const items = connections.flatMap((connection) => {
    const source = byId.get(connection.sourceId); const target = byId.get(connection.targetId);
    if (!source || !target) return [];
    const flags: string[] = [];
    if (clampEvidenceConfidence(connection.evidenceConfidence) <= 2) flags.push("Low confidence");
    if (!connection.sourceUrls.length) flags.push("No source link");
    if (!connection.sourceAnnotation) flags.push("No source annotation");
    if (!connection.sourceQuote) flags.push("No supporting quotation");
    return [{ connection, source, target, flags, confidenceLabel: evidenceConfidenceLabel(connection.evidenceConfidence) }];
  });
  return items.filter((item) => filter === "all" ? item.flags.length > 0 : filter === "weak" ? clampEvidenceConfidence(item.connection.evidenceConfidence) <= 2 : filter === "uncited" ? !item.connection.sourceUrls.length : !item.connection.sourceQuote).sort((left, right) => left.connection.evidenceConfidence! - right.connection.evidenceConfidence! || right.flags.length - left.flags.length);
}

export function evidenceReviewSummary(concepts: Concept[], connections: Connection[]) {
  const items = evidenceReviewItems(concepts, connections, "all");
  return { total: connections.length, attention: items.length, weak: items.filter((item) => clampEvidenceConfidence(item.connection.evidenceConfidence) <= 2).length, uncited: items.filter((item) => !item.connection.sourceUrls.length).length, unquoted: items.filter((item) => !item.connection.sourceQuote).length };
}
