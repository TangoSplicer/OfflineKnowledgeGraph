import * as Crypto from "expo-crypto";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { bytesToHex, hexToBytes } from "@noble/ciphers/utils.js";
import { scryptAsync } from "@noble/hashes/scrypt.js";

import { mergeSuggestionFeedback, type SuggestionFeedback } from "./suggestion-feedback";

export type EncryptedFeedbackEnvelope = {
  schemaVersion: 1;
  cipher: "xchacha20poly1305";
  kdf: { name: "scrypt"; N: 32768; r: 8; p: 1; salt: string };
  nonce: string;
  ciphertext: string;
};

export type SyncConflictPreview = { localEvents: number; remoteEvents: number; mergedEvents: number };
const KDF = { N: 32768 as const, r: 8 as const, p: 1 as const, dkLen: 32, maxmem: 64 * 1024 * 1024 };

function encode(value: unknown) { return new TextEncoder().encode(JSON.stringify(value)); }
function decode<T>(bytes: Uint8Array): T { return JSON.parse(new TextDecoder().decode(bytes)) as T; }
function isEnvelope(value: unknown): value is EncryptedFeedbackEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<EncryptedFeedbackEnvelope>;
  return envelope.schemaVersion === 1 && envelope.cipher === "xchacha20poly1305" && envelope.kdf?.name === "scrypt" && envelope.kdf.N === KDF.N && envelope.kdf.r === KDF.r && envelope.kdf.p === KDF.p && typeof envelope.kdf.salt === "string" && typeof envelope.nonce === "string" && typeof envelope.ciphertext === "string";
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  if (passphrase.trim().length < 12) throw new Error("Use a sync passphrase with at least 12 characters.");
  return scryptAsync(passphrase.normalize("NFKC"), salt, KDF);
}

export async function encryptSyncValue<T>(value: T, passphrase: string): Promise<EncryptedFeedbackEnvelope> {
  const salt = await Crypto.getRandomBytesAsync(16);
  const nonce = await Crypto.getRandomBytesAsync(24);
  const key = await deriveKey(passphrase, salt);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(encode(value));
  return { schemaVersion: 1, cipher: "xchacha20poly1305", kdf: { name: "scrypt", N: KDF.N, r: KDF.r, p: KDF.p, salt: bytesToHex(salt) }, nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) };
}

export async function decryptSyncValue<T>(raw: string, passphrase: string): Promise<T> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("The remote sync envelope is not valid JSON."); }
  if (!isEnvelope(parsed)) throw new Error("This remote profile uses an unsupported encrypted sync format.");
  try {
    const key = await deriveKey(passphrase, hexToBytes(parsed.kdf.salt));
    return decode<T>(xchacha20poly1305(key, hexToBytes(parsed.nonce)).decrypt(hexToBytes(parsed.ciphertext)));
  } catch (error) {
    if (error instanceof Error && error.message.includes("at least")) throw error;
    throw new Error("Unable to decrypt this profile. Check the sync passphrase.");
  }
}

export const encryptFeedbackProfile = (feedback: SuggestionFeedback, passphrase: string) => encryptSyncValue(feedback, passphrase);
export const decryptFeedbackProfile = (raw: string, passphrase: string) => decryptSyncValue<SuggestionFeedback>(raw, passphrase);

export function previewSyncConflict(local: SuggestionFeedback, remote: SuggestionFeedback): SyncConflictPreview { return { localEvents: local.events.length, remoteEvents: remote.events.length, mergedEvents: mergeSuggestionFeedback(local, remote).events.length }; }
export function resolveSyncConflict(local: SuggestionFeedback, remote: SuggestionFeedback, strategy: "merge" | "local" | "remote") { return strategy === "merge" ? mergeSuggestionFeedback(local, remote) : strategy === "local" ? local : remote; }
