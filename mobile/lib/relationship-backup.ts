import {
  clampRelationshipStrength,
  clampEvidenceConfidence,
  concepts as seededConcepts,
  isConceptKind,
  isRelationshipType,
  normalizeSourceUrls,
  sameConceptPair,
  sanitizeRelationshipNote,
  sanitizeSourceAnnotation,
  sanitizeSourceQuote,
  type Concept,
  type Connection,
} from "./knowledge-data";
import { normalizeConceptTags } from "./concept-tags";

export const GRAPH_BACKUP_SCHEMA_VERSION = 2;

export type GraphBackup = {
  schemaVersion: typeof GRAPH_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  concepts: Concept[];
  connections: Connection[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function createGraphBackup(concepts: Concept[], connections: Connection[], exportedAt = new Date().toISOString()): GraphBackup {
  return {
    schemaVersion: GRAPH_BACKUP_SCHEMA_VERSION,
    exportedAt,
    concepts: concepts.map((concept) => ({ ...concept, title: concept.title.trim(), summary: concept.summary.trim(), note: concept.note.trim(), tags: normalizeConceptTags(concept.tags), sourceUrls: normalizeSourceUrls(concept.sourceUrls), sourceAnnotation: sanitizeSourceAnnotation(concept.sourceAnnotation), sourceQuote: sanitizeSourceQuote(concept.sourceQuote) })),
    connections: connections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note), sourceUrls: normalizeSourceUrls(connection.sourceUrls), sourceAnnotation: sanitizeSourceAnnotation(connection.sourceAnnotation), sourceQuote: sanitizeSourceQuote(connection.sourceQuote), evidenceConfidence: clampEvidenceConfidence(connection.evidenceConfidence) })),
  };
}

export const serializeGraphBackup = (concepts: Concept[], connections: Connection[]) => JSON.stringify(createGraphBackup(concepts, connections), null, 2);

function parseConcept(value: unknown): Concept {
  if (!isRecord(value)) throw new Error("The backup contains an invalid concept.");
  const { id, title, kind, summary, note, updatedAt, backlinks, color, tags, sourceUrls, sourceAnnotation, sourceQuote, archivedAt } = value;
  if (
    typeof id !== "string" || !id.trim() ||
    typeof title !== "string" || !title.trim() ||
    typeof kind !== "string" || !isConceptKind(kind) ||
    typeof summary !== "string" ||
    typeof note !== "string" ||
    typeof updatedAt !== "string" ||
    typeof backlinks !== "number" || !Number.isFinite(backlinks) ||
    typeof color !== "string" || !color.trim()
  ) throw new Error("The backup contains a concept that cannot be restored to this graph.");
  if (tags !== undefined && (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string"))) throw new Error("The backup contains invalid concept tags.");
  if (sourceUrls !== undefined && (!Array.isArray(sourceUrls) || !sourceUrls.every((url) => typeof url === "string"))) throw new Error("The backup contains invalid concept sources.");
  if (sourceAnnotation !== undefined && typeof sourceAnnotation !== "string") throw new Error("The backup contains an invalid concept source annotation.");
  if (sourceQuote !== undefined && typeof sourceQuote !== "string") throw new Error("The backup contains an invalid concept source quotation.");
  if (archivedAt !== undefined && (typeof archivedAt !== "number" || !Number.isFinite(archivedAt))) throw new Error("The backup contains an invalid archive timestamp.");
  return { id: id.trim(), title: title.trim(), kind, summary: summary.trim(), note: note.trim().slice(0, 4_000), updatedAt, backlinks: Math.max(0, Math.round(backlinks)), color: color.trim(), tags: normalizeConceptTags(tags as string[] | undefined), sourceUrls: normalizeSourceUrls(sourceUrls as string[] | undefined), sourceAnnotation: sanitizeSourceAnnotation(sourceAnnotation), sourceQuote: sanitizeSourceQuote(sourceQuote), archivedAt };
}

function parseConnection(value: unknown, knownConceptIds: Set<string>, normalized: Connection[]): Connection {
  if (!isRecord(value)) throw new Error("The backup contains an invalid relationship.");
  const { id, sourceId, targetId, relationship, strength, note, sourceUrls, sourceAnnotation, sourceQuote, evidenceConfidence } = value;
  if (
    typeof id !== "string" ||
    typeof sourceId !== "string" ||
    typeof targetId !== "string" ||
    typeof relationship !== "string" ||
    typeof strength !== "number" ||
    !Number.isFinite(strength) ||
    sourceId === targetId ||
    !knownConceptIds.has(sourceId) ||
    !knownConceptIds.has(targetId) ||
    !isRelationshipType(relationship)
  ) throw new Error("The backup contains a relationship that cannot be restored to this graph.");
  if (sourceUrls !== undefined && (!Array.isArray(sourceUrls) || !sourceUrls.every((url) => typeof url === "string"))) throw new Error("The backup contains invalid relationship sources.");
  if (sourceAnnotation !== undefined && typeof sourceAnnotation !== "string") throw new Error("The backup contains an invalid relationship source annotation.");
  if (sourceQuote !== undefined && typeof sourceQuote !== "string") throw new Error("The backup contains an invalid relationship source quotation.");
  if (evidenceConfidence !== undefined && (typeof evidenceConfidence !== "number" || !Number.isFinite(evidenceConfidence))) throw new Error("The backup contains an invalid relationship confidence score.");
  if (normalized.some((connection) => sameConceptPair(connection, sourceId, targetId))) throw new Error("The backup contains duplicate relationships.");
  return { id, sourceId, targetId, relationship, strength: clampRelationshipStrength(strength), note: typeof note === "string" ? sanitizeRelationshipNote(note) : "", sourceUrls: normalizeSourceUrls(sourceUrls as string[] | undefined), sourceAnnotation: sanitizeSourceAnnotation(sourceAnnotation), sourceQuote: sanitizeSourceQuote(sourceQuote), evidenceConfidence: clampEvidenceConfidence(evidenceConfidence) };
}

export function parseGraphBackup(serialized: string): GraphBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== GRAPH_BACKUP_SCHEMA_VERSION || !Array.isArray(parsed.concepts) || !Array.isArray(parsed.connections)) {
    throw new Error("This is not a compatible Offline Knowledge Graph complete backup.");
  }

  const normalizedConcepts: Concept[] = [];
  for (const value of parsed.concepts) {
    const concept = parseConcept(value);
    if (normalizedConcepts.some((existing) => existing.id === concept.id)) throw new Error("The backup contains duplicate concepts.");
    normalizedConcepts.push(concept);
  }
  if (!normalizedConcepts.length) throw new Error("The backup must contain at least one concept.");

  const knownConceptIds = new Set(normalizedConcepts.map((concept) => concept.id));
  const normalizedConnections: Connection[] = [];
  for (const value of parsed.connections) normalizedConnections.push(parseConnection(value, knownConceptIds, normalizedConnections));

  return { schemaVersion: GRAPH_BACKUP_SCHEMA_VERSION, exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : "Unknown date", concepts: normalizedConcepts, connections: normalizedConnections };
}

// Kept as a compatibility alias for callers that used the previous utility name.
export const createRelationshipBackup = (connections: Connection[], exportedAt?: string) => createGraphBackup(seededConcepts, connections, exportedAt);
export const serializeRelationshipBackup = (connections: Connection[]) => serializeGraphBackup(seededConcepts, connections);
export const parseRelationshipBackup = parseGraphBackup;
