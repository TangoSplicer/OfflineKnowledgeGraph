import {
  clampRelationshipStrength,
  concepts as seededConcepts,
  isConceptKind,
  isRelationshipType,
  sameConceptPair,
  sanitizeRelationshipNote,
  type Concept,
  type Connection,
} from "./knowledge-data";

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
    concepts: concepts.map((concept) => ({ ...concept, title: concept.title.trim(), summary: concept.summary.trim(), note: concept.note.trim() })),
    connections: connections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note) })),
  };
}

export const serializeGraphBackup = (concepts: Concept[], connections: Connection[]) => JSON.stringify(createGraphBackup(concepts, connections), null, 2);

function parseConcept(value: unknown): Concept {
  if (!isRecord(value)) throw new Error("The backup contains an invalid concept.");
  const { id, title, kind, summary, note, updatedAt, backlinks, color } = value;
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
  return { id: id.trim(), title: title.trim(), kind, summary: summary.trim(), note: note.trim().slice(0, 4_000), updatedAt, backlinks: Math.max(0, Math.round(backlinks)), color: color.trim() };
}

function parseConnection(value: unknown, knownConceptIds: Set<string>, normalized: Connection[]): Connection {
  if (!isRecord(value)) throw new Error("The backup contains an invalid relationship.");
  const { id, sourceId, targetId, relationship, strength, note } = value;
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
  if (normalized.some((connection) => sameConceptPair(connection, sourceId, targetId))) throw new Error("The backup contains duplicate relationships.");
  return { id, sourceId, targetId, relationship, strength: clampRelationshipStrength(strength), note: typeof note === "string" ? sanitizeRelationshipNote(note) : "" };
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
