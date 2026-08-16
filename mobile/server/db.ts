import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditSyncEnvelopes, feedbackSyncEnvelopes, graphSyncEnvelopes, graphSyncSnapshots, InsertUser, subgraphSyncEnvelopes, trustedSyncDevices, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getFeedbackSyncEnvelope(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync.");
  const rows = await db.select().from(feedbackSyncEnvelopes).where(eq(feedbackSyncEnvelopes.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function putFeedbackSyncEnvelope(userId: number, envelope: string, expectedRevision: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync.");
  const existing = await getFeedbackSyncEnvelope(userId);
  if (!existing) {
    if (expectedRevision !== 0) return { status: "conflict" as const, revision: 0 };
    await db.insert(feedbackSyncEnvelopes).values({ userId, envelope, revision: 1 });
    return { status: "saved" as const, revision: 1 };
  }
  if (existing.revision !== expectedRevision) return { status: "conflict" as const, revision: existing.revision };
  const revision = existing.revision + 1;
  await db.update(feedbackSyncEnvelopes).set({ envelope, revision, updatedAt: new Date() }).where(eq(feedbackSyncEnvelopes.userId, userId));
  return { status: "saved" as const, revision };
}

export async function deleteFeedbackSyncEnvelope(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync.");
  await db.delete(feedbackSyncEnvelopes).where(eq(feedbackSyncEnvelopes.userId, userId));
  return { deleted: true };
}

export async function registerTrustedSyncDevice(userId: number, device: { id: string; label: string; platform: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for trusted devices.");
  const existing = await db.select().from(trustedSyncDevices).where(eq(trustedSyncDevices.id, device.id)).limit(1);
  if (existing[0] && existing[0].userId !== userId) throw new Error("This device identifier belongs to another account.");
  if (existing[0]) {
    await db.update(trustedSyncDevices).set({ label: device.label, platform: device.platform, revokedAt: null, lastSeenAt: new Date() }).where(eq(trustedSyncDevices.id, device.id));
  } else {
    await db.insert(trustedSyncDevices).values({ id: device.id, userId, label: device.label, platform: device.platform });
  }
  return getTrustedSyncDevices(userId);
}

export async function getTrustedSyncDevices(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for trusted devices.");
  return db.select().from(trustedSyncDevices).where(eq(trustedSyncDevices.userId, userId));
}

async function assertTrustedSyncDevice(userId: number, deviceId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted graph sync.");
  const devices = await db.select().from(trustedSyncDevices).where(and(eq(trustedSyncDevices.userId, userId), eq(trustedSyncDevices.id, deviceId), isNull(trustedSyncDevices.revokedAt))).limit(1);
  if (!devices[0]) throw new Error("This device is not trusted for encrypted graph synchronization.");
  await db.update(trustedSyncDevices).set({ lastSeenAt: new Date() }).where(eq(trustedSyncDevices.id, deviceId));
  return db;
}

export async function revokeTrustedSyncDevice(userId: number, deviceId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for trusted devices.");
  await db.update(trustedSyncDevices).set({ revokedAt: new Date() }).where(and(eq(trustedSyncDevices.userId, userId), eq(trustedSyncDevices.id, deviceId)));
  return { revoked: true };
}

export async function getGraphSyncEnvelope(userId: number, deviceId: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  const rows = await db.select().from(graphSyncEnvelopes).where(eq(graphSyncEnvelopes.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function putGraphSyncEnvelope(userId: number, deviceId: string, envelope: string, expectedRevision: number) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  const rows = await db.select().from(graphSyncEnvelopes).where(eq(graphSyncEnvelopes.userId, userId)).limit(1);
  const existing = rows[0];
  if (!existing) {
    if (expectedRevision !== 0) return { status: "conflict" as const, revision: 0 };
    await db.insert(graphSyncEnvelopes).values({ userId, envelope, revision: 1 });
    return { status: "saved" as const, revision: 1 };
  }
  if (existing.revision !== expectedRevision) return { status: "conflict" as const, revision: existing.revision };
  const revision = existing.revision + 1;
  await db.update(graphSyncEnvelopes).set({ envelope, revision, updatedAt: new Date() }).where(eq(graphSyncEnvelopes.userId, userId));
  return { status: "saved" as const, revision };
}

export async function deleteGraphSyncEnvelope(userId: number, deviceId: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  await db.delete(graphSyncEnvelopes).where(eq(graphSyncEnvelopes.userId, userId));
  return { deleted: true };
}

export async function getAuditSyncEnvelope(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync audit history.");
  const rows = await db.select().from(auditSyncEnvelopes).where(eq(auditSyncEnvelopes.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function putAuditSyncEnvelope(userId: number, envelope: string, expectedRevision: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync audit history.");
  const existing = await getAuditSyncEnvelope(userId);
  if (!existing) {
    if (expectedRevision !== 0) return { status: "conflict" as const, revision: 0 };
    await db.insert(auditSyncEnvelopes).values({ userId, envelope, revision: 1 });
    return { status: "saved" as const, revision: 1 };
  }
  if (existing.revision !== expectedRevision) return { status: "conflict" as const, revision: existing.revision };
  const revision = existing.revision + 1;
  await db.update(auditSyncEnvelopes).set({ envelope, revision, updatedAt: new Date() }).where(eq(auditSyncEnvelopes.userId, userId));
  return { status: "saved" as const, revision };
}

export async function deleteAuditSyncEnvelope(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable for encrypted sync audit history.");
  await db.delete(auditSyncEnvelopes).where(eq(auditSyncEnvelopes.userId, userId));
  return { deleted: true };
}

export async function listSubgraphSyncEnvelopes(userId: number, deviceId: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  return db.select({ id: subgraphSyncEnvelopes.id, label: subgraphSyncEnvelopes.label, revision: subgraphSyncEnvelopes.revision, updatedAt: subgraphSyncEnvelopes.updatedAt }).from(subgraphSyncEnvelopes).where(eq(subgraphSyncEnvelopes.userId, userId));
}

export async function getSubgraphSyncEnvelope(userId: number, deviceId: string, id: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  const rows = await db.select().from(subgraphSyncEnvelopes).where(and(eq(subgraphSyncEnvelopes.userId, userId), eq(subgraphSyncEnvelopes.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function putSubgraphSyncEnvelope(userId: number, deviceId: string, id: string, label: string, envelope: string, expectedRevision: number) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  const rows = await db.select().from(subgraphSyncEnvelopes).where(and(eq(subgraphSyncEnvelopes.userId, userId), eq(subgraphSyncEnvelopes.id, id))).limit(1);
  const existing = rows[0];
  if (!existing) {
    if (expectedRevision !== 0) return { status: "conflict" as const, revision: 0 };
    await db.insert(subgraphSyncEnvelopes).values({ id, userId, label, envelope, revision: 1 });
    return { status: "saved" as const, revision: 1 };
  }
  if (existing.revision !== expectedRevision) return { status: "conflict" as const, revision: existing.revision };
  const revision = existing.revision + 1;
  await db.update(subgraphSyncEnvelopes).set({ label, envelope, revision, updatedAt: new Date() }).where(and(eq(subgraphSyncEnvelopes.userId, userId), eq(subgraphSyncEnvelopes.id, id)));
  return { status: "saved" as const, revision };
}

export async function deleteSubgraphSyncEnvelope(userId: number, deviceId: string, id: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  await db.delete(subgraphSyncEnvelopes).where(and(eq(subgraphSyncEnvelopes.userId, userId), eq(subgraphSyncEnvelopes.id, id)));
  return { deleted: true };
}

export async function listGraphSyncSnapshots(userId: number, deviceId: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  return db.select({ id: graphSyncSnapshots.id, sourceRevision: graphSyncSnapshots.sourceRevision, label: graphSyncSnapshots.label, conceptCount: graphSyncSnapshots.conceptCount, relationshipCount: graphSyncSnapshots.relationshipCount, conceptKinds: graphSyncSnapshots.conceptKinds, conceptTags: graphSyncSnapshots.conceptTags, createdAt: graphSyncSnapshots.createdAt }).from(graphSyncSnapshots).where(eq(graphSyncSnapshots.userId, userId)).orderBy(desc(graphSyncSnapshots.createdAt)).limit(10);
}

export async function getGraphSyncSnapshot(userId: number, deviceId: string, id: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  const rows = await db.select().from(graphSyncSnapshots).where(and(eq(graphSyncSnapshots.userId, userId), eq(graphSyncSnapshots.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function putGraphSyncSnapshot(userId: number, deviceId: string, input: { id: string; sourceRevision: number; label: string; envelope: string; conceptCount: number; relationshipCount: number; conceptKinds: string; conceptTags: string }) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  await db.insert(graphSyncSnapshots).values({ userId, ...input });
  const rows = await db.select({ id: graphSyncSnapshots.id }).from(graphSyncSnapshots).where(eq(graphSyncSnapshots.userId, userId)).orderBy(desc(graphSyncSnapshots.createdAt));
  const staleIds = rows.slice(10).map((row) => row.id);
  if (staleIds.length) await db.delete(graphSyncSnapshots).where(and(eq(graphSyncSnapshots.userId, userId), inArray(graphSyncSnapshots.id, staleIds)));
  return { saved: true, retained: Math.min(rows.length, 10) };
}

export async function deleteGraphSyncSnapshot(userId: number, deviceId: string, id: string) {
  const db = await assertTrustedSyncDevice(userId, deviceId);
  await db.delete(graphSyncSnapshots).where(and(eq(graphSyncSnapshots.userId, userId), eq(graphSyncSnapshots.id, id)));
  return { deleted: true };
}

// TODO: add feature queries here as your schema grows.
