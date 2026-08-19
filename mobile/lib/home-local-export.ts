import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { bytesToHex, hexToBytes } from "@noble/ciphers/utils.js";

import { decryptSyncValue, encryptSyncValue, type EncryptedFeedbackEnvelope } from "./encrypted-feedback-sync";
import { parseGraphBackup, type GraphBackup } from "./relationship-backup";

export type HomeLocalExportState = "idle" | "exporting" | "complete" | "error";

export function homeLocalExportFilename(exportedAt: Date): string {
  return `offline-knowledge-graph-${exportedAt.toISOString().slice(0, 10)}.json`;
}

export function homeLocalExportBundleFilename(exportedAt: Date): string {
  return `offline-knowledge-graph-${exportedAt.toISOString().slice(0, 10)}.zip`;
}

export function homeProtectedExportBundleFilename(exportedAt: Date): string {
  return `offline-knowledge-graph-${exportedAt.toISOString().slice(0, 10)}-protected.zip`;
}

export function homeLocalGraphImageFilename(exportedAt: Date): string {
  return `offline-knowledge-graph-${exportedAt.toISOString().slice(0, 10)}.svg`;
}

export function buildHomeLocalExportBundle(jsonFilename: string, serializedGraph: string, imageFilename: string, graphSvg: string): Uint8Array {
  return zipSync({ [jsonFilename]: strToU8(serializedGraph), [imageFilename]: strToU8(graphSvg) }, { level: 6 });
}

type ProtectedExportPayload = { schemaVersion: 1; type: "offline-knowledge-graph.zip"; filename: string; archiveHex: string };
export type ExportPassphraseValidation = { valid: true } | { valid: false; message: string };
export type ExportPassphraseStrength = { label: "Add passphrase" | "Too short" | "Fair" | "Strong"; detail: string; score: 0 | 1 | 2 | 3 };

export function exportPassphraseStrength(passphrase: string): ExportPassphraseStrength {
  const value = passphrase.normalize("NFKC");
  if (!value) return { label: "Add passphrase", detail: "Use 12 or more characters you can recover from memory.", score: 0 };
  if (value.trim().length < 12) return { label: "Too short", detail: "Use at least 12 characters before exporting.", score: 0 };
  const variety = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const score = Math.min(3, 1 + (value.length >= 16 ? 1 : 0) + (variety >= 3 ? 1 : 0)) as 1 | 2 | 3;
  if (score === 3) return { label: "Strong", detail: "Long and varied. Keep it private; it cannot be recovered.", score };
  if (score === 2) return { label: "Fair", detail: "Use a longer phrase or add more character variety for stronger protection.", score };
  return { label: "Fair", detail: "A longer phrase is more resilient. Keep it somewhere safe you control.", score };
}

export function validateExportPassphrase(passphrase: string, confirmation: string): ExportPassphraseValidation {
  if (!passphrase) return { valid: false, message: "Enter a passphrase to protect this export." };
  if (passphrase.trim().length < 12) return { valid: false, message: "Use a passphrase with at least 12 characters." };
  if (passphrase !== confirmation) return { valid: false, message: "The passphrases do not match." };
  return { valid: true };
}

export async function buildPasswordProtectedExportBundle(bundle: Uint8Array, originalFilename: string, passphrase: string): Promise<Uint8Array> {
  const encrypted = await encryptSyncValue<ProtectedExportPayload>({ schemaVersion: 1, type: "offline-knowledge-graph.zip", filename: originalFilename, archiveHex: bytesToHex(bundle) }, passphrase);
  const readme = "This Offline Knowledge Graph export is protected with your passphrase. Open it in Offline Knowledge Graph and enter the same passphrase to restore it. The passphrase is not stored and cannot be recovered.";
  return zipSync({ "offline-knowledge-graph.encrypted.json": strToU8(JSON.stringify(encrypted)), "README.txt": strToU8(readme) }, { level: 6 });
}

export async function decryptPasswordProtectedExportBundle(protectedBundle: Uint8Array, passphrase: string): Promise<{ filename: string; archive: Uint8Array }> {
  let encryptedRaw: string;
  try {
    const files = unzipSync(protectedBundle);
    const encryptedFile = files["offline-knowledge-graph.encrypted.json"];
    if (!encryptedFile) throw new Error("Missing protected export payload.");
    encryptedRaw = strFromU8(encryptedFile);
  } catch {
    throw new Error("This protected export is corrupted or unsupported.");
  }
  const payload = await decryptSyncValue<ProtectedExportPayload>(encryptedRaw, passphrase);
  if (payload.schemaVersion !== 1 || payload.type !== "offline-knowledge-graph.zip" || !payload.filename || !payload.archiveHex) throw new Error("This protected export is incompatible.");
  try {
    return { filename: payload.filename, archive: hexToBytes(payload.archiveHex) };
  } catch {
    throw new Error("This protected export is corrupted or unsupported.");
  }
}

export async function decryptProtectedExportGraph(protectedBundle: Uint8Array, passphrase: string): Promise<GraphBackup> {
  const { archive } = await decryptPasswordProtectedExportBundle(protectedBundle, passphrase);
  try {
    const files = unzipSync(archive);
    const graphFilename = Object.keys(files).find((filename) => filename.endsWith(".json"));
    if (!graphFilename || !files[graphFilename]) throw new Error("Missing graph backup.");
    return parseGraphBackup(strFromU8(files[graphFilename]));
  } catch {
    throw new Error("The protected export does not contain a valid graph backup.");
  }
}

export function homeLocalExportMessage(
  state: HomeLocalExportState,
  conceptCount: number,
  connectionCount: number,
): string {
  if (state === "exporting") return "Preparing your complete local backup package…";
  if (state === "complete") return `${conceptCount} concepts, ${connectionCount} relationships, and a graph image saved locally.`;
  if (state === "error") return "The local export could not be completed. Please try again.";
  return "Create a ZIP with your complete JSON graph and an SVG graph image.";
}
