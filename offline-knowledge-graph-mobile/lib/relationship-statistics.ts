import { relationshipTypes, type Connection, type RelationshipType } from "./knowledge-data";

export type RelationshipTypeStat = { type: RelationshipType; count: number; ratio: number };
export type RelationshipStrengthStat = { strength: number; count: number; ratio: number };
export type RelationshipStatistics = {
  total: number;
  noted: number;
  averageStrength: number;
  byType: RelationshipTypeStat[];
  byStrength: RelationshipStrengthStat[];
};

export function calculateRelationshipStatistics(connections: Connection[]): RelationshipStatistics {
  const total = connections.length;
  const byType = relationshipTypes.map((type) => {
    const count = connections.filter((connection) => connection.relationship === type).length;
    return { type, count, ratio: total ? count / total : 0 };
  });
  const byStrength = [1, 2, 3, 4, 5].map((strength) => {
    const count = connections.filter((connection) => connection.strength === strength).length;
    return { strength, count, ratio: total ? count / total : 0 };
  });
  return {
    total,
    noted: connections.filter((connection) => Boolean(connection.note)).length,
    averageStrength: total ? connections.reduce((sum, connection) => sum + connection.strength, 0) / total : 0,
    byType,
    byStrength,
  };
}
