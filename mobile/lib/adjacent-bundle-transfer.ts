import * as Crypto from "expo-crypto";
import { encryptCompleteGraph, decryptCompleteGraph } from "./encrypted-graph-sync";
import type { GraphBackup } from "./relationship-backup";

export const ADJACENT_BUNDLE_PROTOCOL_VERSION = 1;
export const ADJACENT_BUNDLE_TTL_MS = 180_000;

export type AdjacentEncryptedBundlePayload = {
  version: typeof ADJACENT_BUNDLE_PROTOCOL_VERSION;
  scope: "adjacent-graph-bundle";
  senderDeviceId: string;
  senderLabel: string;
  encryptedEnvelope: string;
  conceptCount: number;
  relationshipCount: number;
  nonce: string;
  createdAt: number;
  expiresAt: number;
};

export async function createAdjacentEncryptedBundle(
  graph: GraphBackup,
  passphrase: string,
  senderDeviceId: string,
  senderLabel: string,
  now = Date.now()
): Promise<string> {
  const encryptedEnvelope = JSON.stringify(await encryptCompleteGraph(graph.concepts, graph.connections, passphrase));
  const payload: AdjacentEncryptedBundlePayload = {
    version: ADJACENT_BUNDLE_PROTOCOL_VERSION,
    scope: "adjacent-graph-bundle",
    senderDeviceId: senderDeviceId.trim(),
    senderLabel: senderLabel.trim(),
    encryptedEnvelope,
    conceptCount: graph.concepts.length,
    relationshipCount: graph.connections.length,
    nonce: Crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + ADJACENT_BUNDLE_TTL_MS,
  };
  return JSON.stringify(payload);
}

export function parseAdjacentEncryptedBundle(serialized: string, now = Date.now()): AdjacentEncryptedBundlePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("This is not a valid adjacent encrypted backup bundle.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("This is not a valid adjacent encrypted backup bundle.");
  }
  const record = parsed as Record<string, unknown>;
  if (
    record.version !== ADJACENT_BUNDLE_PROTOCOL_VERSION ||
    record.scope !== "adjacent-graph-bundle" ||
    typeof record.senderDeviceId !== "string" ||
    !record.senderDeviceId.trim() ||
    typeof record.senderLabel !== "string" ||
    !record.senderLabel.trim() ||
    typeof record.encryptedEnvelope !== "string" ||
    !record.encryptedEnvelope.trim() ||
    typeof record.conceptCount !== "number" ||
    typeof record.relationshipCount !== "number" ||
    typeof record.nonce !== "string" ||
    !record.nonce.trim() ||
    typeof record.createdAt !== "number" ||
    typeof record.expiresAt !== "number"
  ) {
    throw new Error("This adjacent backup bundle is malformed or incompatible.");
  }
  if (record.expiresAt <= record.createdAt || now > record.expiresAt) {
    throw new Error("This adjacent backup bundle has expired. Export a fresh bundle from the sender device.");
  }
  return {
    version: ADJACENT_BUNDLE_PROTOCOL_VERSION,
    scope: "adjacent-graph-bundle",
    senderDeviceId: record.senderDeviceId.trim(),
    senderLabel: record.senderLabel.trim(),
    encryptedEnvelope: record.encryptedEnvelope,
    conceptCount: record.conceptCount,
    relationshipCount: record.relationshipCount,
    nonce: record.nonce.trim(),
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}

export async function decryptAdjacentEncryptedBundle(serialized: string, passphrase: string, usedNonces: Set<string>, now = Date.now()): Promise<{ payload: AdjacentEncryptedBundlePayload; graph: GraphBackup }> {
  const payload = parseAdjacentEncryptedBundle(serialized, now);
  if (usedNonces.has(payload.nonce)) {
    throw new Error("This backup bundle has already been imported. Replay attempts are blocked.");
  }
  usedNonces.add(payload.nonce);
  const graph = await decryptCompleteGraph(payload.encryptedEnvelope, passphrase);
  return { payload, graph };
}
