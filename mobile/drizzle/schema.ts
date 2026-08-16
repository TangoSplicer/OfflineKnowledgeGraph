import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Opaque encrypted feedback profile for one authenticated user. The server
 * stores only ciphertext metadata and never receives the sync passphrase or
 * decrypted feedback events.
 */
export const feedbackSyncEnvelopes = mysqlTable("feedback_sync_envelopes", {
  userId: int("userId").primaryKey().notNull(),
  envelope: text("envelope").notNull(),
  revision: int("revision").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** An account-owned device registry used to allow or revoke encrypted graph synchronization. */
export const trustedSyncDevices = mysqlTable("trusted_sync_devices", {
  id: varchar("id", { length: 96 }).primaryKey().notNull(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  platform: varchar("platform", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

/** Opaque end-to-end encrypted complete-graph envelope for one authenticated account. */
export const graphSyncEnvelopes = mysqlTable("graph_sync_envelopes", {
  userId: int("userId").primaryKey().notNull(),
  envelope: text("envelope").notNull(),
  revision: int("revision").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Opaque encrypted tamper-evident audit ledger for one authenticated account. */
export const auditSyncEnvelopes = mysqlTable("audit_sync_envelopes", {
  userId: int("userId").primaryKey().notNull(),
  envelope: text("envelope").notNull(),
  revision: int("revision").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Independently revisioned opaque encrypted subgraph collection. */
export const subgraphSyncEnvelopes = mysqlTable("subgraph_sync_envelopes", {
  id: varchar("id", { length: 96 }).primaryKey().notNull(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  envelope: text("envelope").notNull(),
  revision: int("revision").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Rolling opaque encrypted complete-graph snapshots retained for explicit rollback. */
export const graphSyncSnapshots = mysqlTable("graph_sync_snapshots", {
  id: varchar("id", { length: 96 }).primaryKey().notNull(),
  userId: int("userId").notNull(),
  sourceRevision: int("sourceRevision").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  envelope: text("envelope").notNull(),
  conceptCount: int("conceptCount").notNull(),
  relationshipCount: int("relationshipCount").notNull(),
  conceptKinds: varchar("conceptKinds", { length: 512 }).notNull().default("[]"),
  conceptTags: varchar("conceptTags", { length: 512 }).notNull().default("[]"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type FeedbackSyncEnvelope = typeof feedbackSyncEnvelopes.$inferSelect;
export type InsertFeedbackSyncEnvelope = typeof feedbackSyncEnvelopes.$inferInsert;
export type TrustedSyncDevice = typeof trustedSyncDevices.$inferSelect;
export type GraphSyncEnvelope = typeof graphSyncEnvelopes.$inferSelect;
export type AuditSyncEnvelope = typeof auditSyncEnvelopes.$inferSelect;
export type SubgraphSyncEnvelope = typeof subgraphSyncEnvelopes.$inferSelect;
export type GraphSyncSnapshot = typeof graphSyncSnapshots.$inferSelect;

// TODO: Add your tables here
