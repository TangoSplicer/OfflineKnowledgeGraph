import {
  clampRelationshipStrength,
  concepts,
  isRelationshipType,
  sameConceptPair,
  sanitizeRelationshipNote,
  type Connection,
} from "./knowledge-data";

export const RELATIONSHIP_BACKUP_SCHEMA_VERSION = 1;

export type RelationshipBackup = {
  schemaVersion: typeof RELATIONSHIP_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  connections: Connection[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function createRelationshipBackup(connections: Connection[], exportedAt = new Date().toISOString()): RelationshipBackup {
  return {
    schemaVersion: RELATIONSHIP_BACKUP_SCHEMA_VERSION,
    exportedAt,
    connections: connections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note) })),
  };
}

export const serializeRelationshipBackup = (connections: Connection[]) => JSON.stringify(createRelationshipBackup(connections), null, 2);

export function parseRelationshipBackup(serialized: string): RelationshipBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== RELATIONSHIP_BACKUP_SCHEMA_VERSION || !Array.isArray(parsed.connections)) {
    throw new Error("This is not a compatible Offline Knowledge Graph relationship backup.");
  }

  const knownConceptIds = new Set(concepts.map((concept) => concept.id));
  const normalized: Connection[] = [];
  for (const value of parsed.connections) {
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
    ) {
      throw new Error("The backup contains a relationship that cannot be restored to this graph.");
    }

    if (normalized.some((connection) => sameConceptPair(connection, sourceId, targetId))) {
      throw new Error("The backup contains duplicate relationships.");
    }

    normalized.push({
      id,
      sourceId,
      targetId,
      relationship,
      strength: clampRelationshipStrength(strength),
      note: typeof note === "string" ? sanitizeRelationshipNote(note) : "",
    });
  }

  return {
    schemaVersion: RELATIONSHIP_BACKUP_SCHEMA_VERSION,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : "Unknown date",
    connections: normalized,
  };
}
