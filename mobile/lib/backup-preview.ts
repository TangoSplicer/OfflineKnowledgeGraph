import type { GraphBackup } from "./relationship-backup";

export type BackupPreview = {
  exportedAt: string;
  conceptCount: number;
  relationshipCount: number;
  notedRelationshipCount: number;
  conceptKinds: string[];
};

export function createBackupPreview(backup: GraphBackup): BackupPreview {
  return {
    exportedAt: backup.exportedAt,
    conceptCount: backup.concepts.length,
    relationshipCount: backup.connections.length,
    notedRelationshipCount: backup.connections.filter((connection) => Boolean(connection.note)).length,
    conceptKinds: Array.from(new Set(backup.concepts.map((concept) => concept.kind))).sort(),
  };
}
