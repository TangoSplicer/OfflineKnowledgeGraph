import * as Crypto from "expo-crypto";

export const ADJACENT_PAIRING_VERSION = 1;
export const EPHEMERAL_TOKEN_TTL_MS = 120_000;

export type PairingTransport = "wifi" | "bluetooth" | "fallback-qr";

export type AdjacentPairingToken = {
  version: typeof ADJACENT_PAIRING_VERSION;
  scope: "adjacent-device-pairing";
  deviceId: string;
  label: string;
  platform: string;
  transport: PairingTransport;
  nonce: string;
  createdAt: number;
  expiresAt: number;
};

const supportedTransports: PairingTransport[] = ["wifi", "bluetooth", "fallback-qr"];

export function createAdjacentPairingToken(deviceId: string, label: string, platform = "unknown", transport: PairingTransport = "wifi", now = Date.now()): string {
  const payload: AdjacentPairingToken = {
    version: ADJACENT_PAIRING_VERSION,
    scope: "adjacent-device-pairing",
    deviceId: deviceId.trim(),
    label: label.trim(),
    platform: platform.trim(),
    transport,
    nonce: Crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + EPHEMERAL_TOKEN_TTL_MS,
  };
  return JSON.stringify(payload);
}

export function parseAdjacentPairingToken(serialized: string, now = Date.now()): AdjacentPairingToken {
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { throw new Error("This is not a valid adjacent pairing token."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("This is not a valid adjacent pairing token.");
  const record = parsed as Record<string, unknown>;
  if (
    record.version !== ADJACENT_PAIRING_VERSION || record.scope !== "adjacent-device-pairing" ||
    typeof record.deviceId !== "string" || !record.deviceId.trim() ||
    typeof record.label !== "string" || !record.label.trim() ||
    typeof record.platform !== "string" || typeof record.transport !== "string" ||
    !supportedTransports.includes(record.transport as PairingTransport) ||
    typeof record.nonce !== "string" || !record.nonce.trim() ||
    typeof record.createdAt !== "number" || !Number.isFinite(record.createdAt) ||
    typeof record.expiresAt !== "number" || !Number.isFinite(record.expiresAt)
  ) throw new Error("This token is malformed or incompatible.");
  if (record.expiresAt <= record.createdAt || now > record.expiresAt) throw new Error("This ephemeral pairing token has expired. Generate a fresh code on the remote device.");
  return {
    version: ADJACENT_PAIRING_VERSION,
    scope: "adjacent-device-pairing",
    deviceId: record.deviceId.trim(), label: record.label.trim(), platform: record.platform.trim(),
    transport: record.transport as PairingTransport, nonce: record.nonce.trim(), createdAt: record.createdAt, expiresAt: record.expiresAt,
  };
}

export function consumeAdjacentPairingToken(serialized: string, usedNonces: Set<string>, now = Date.now()): AdjacentPairingToken {
  const token = parseAdjacentPairingToken(serialized, now);
  if (usedNonces.has(token.nonce)) throw new Error("This pairing token has already been used. Generate a fresh code on the remote device.");
  usedNonces.add(token.nonce);
  return token;
}
