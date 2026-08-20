import { describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync, zipSync } from "fflate";

import { buildHomeLocalExportBundle, buildPasswordProtectedExportBundle, decryptPasswordProtectedExportBundle, decryptProtectedExportGraph, exportPassphraseStrength, homeLocalExportBundleFilename, homeLocalExportFilename, homeLocalExportMessage, homeLocalGraphImageFilename, readProtectedExportRecoveryHint, validateExportPassphrase, validateExportRecoveryHint } from "../lib/home-local-export";
import { createGraphBackup } from "../lib/relationship-backup";
import { concepts, connections } from "../lib/knowledge-data";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length + 23) % 256)),
}));

describe("Home local export feedback", () => {
  it("creates a stable, local-only JSON filename", () => {
    const exportedAt = new Date("2026-08-18T12:34:56.000Z");
    expect(homeLocalExportFilename(exportedAt)).toBe(
      "offline-knowledge-graph-2026-08-18.json",
    );
    expect(homeLocalGraphImageFilename(exportedAt)).toBe("offline-knowledge-graph-2026-08-18.svg");
    expect(homeLocalExportBundleFilename(exportedAt)).toBe("offline-knowledge-graph-2026-08-18.zip");
  });

  it("shows explicit preparation and completion feedback", () => {
    expect(homeLocalExportMessage("exporting", 3, 2)).toContain("Preparing");
    expect(homeLocalExportMessage("complete", 3, 2)).toBe("3 concepts, 2 relationships, and a graph image saved locally.");
    expect(homeLocalExportMessage("idle", 0, 0)).toContain("ZIP");
  });

  it("packages complete graph data and a graph image together", () => {
    const bundle = buildHomeLocalExportBundle("graph.json", '{"concepts":[]}', "graph.svg", "<svg></svg>");
    const files = unzipSync(bundle);
    expect(strFromU8(files["graph.json"]!)).toBe('{"concepts":[]}');
    expect(strFromU8(files["graph.svg"]!)).toBe("<svg></svg>");
  });

  it("encrypts ZIP bytes with a passphrase and rejects wrong passphrases or tampering", async () => {
    const plain = buildHomeLocalExportBundle("graph.json", '{"concepts":[]}', "graph.svg", "<svg></svg>");
    const protectedBundle = await buildPasswordProtectedExportBundle(plain, "graph.zip", "a secure local passphrase");
    await expect(decryptPasswordProtectedExportBundle(protectedBundle, "a secure local passphrase")).resolves.toMatchObject({ filename: "graph.zip", archive: plain });
    await expect(decryptPasswordProtectedExportBundle(protectedBundle, "a different local passphrase")).rejects.toThrow("Unable to decrypt");

    const files = unzipSync(protectedBundle);
    const envelope = JSON.parse(strFromU8(files["offline-knowledge-graph.encrypted.json"]!)) as { ciphertext: string };
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}00`;
    const tampered = zipSync({ ...files, "offline-knowledge-graph.encrypted.json": new TextEncoder().encode(JSON.stringify(envelope)) });
    await expect(decryptPasswordProtectedExportBundle(tampered, "a secure local passphrase")).rejects.toThrow("Unable to decrypt");
  });

  it("recovers a valid graph only after decrypting the protected ZIP", async () => {
    const graph = createGraphBackup([concepts[0], concepts[1]], [connections[0]], "2026-08-19T00:00:00.000Z");
    const archive = buildHomeLocalExportBundle("graph.json", JSON.stringify(graph), "graph.svg", "<svg></svg>");
    const protectedBundle = await buildPasswordProtectedExportBundle(archive, "graph.zip", "a secure local passphrase");
    const restored = await decryptProtectedExportGraph(protectedBundle, "a secure local passphrase");
    expect(restored.concepts.some((concept) => concept.id === concepts[0].id)).toBe(true);
  });

  it("requires a confirmed 12-character passphrase before protected export", () => {
    expect(validateExportPassphrase("short", "short")).toMatchObject({ valid: false });
    expect(validateExportPassphrase("a long passphrase", "different passphrase")).toMatchObject({ valid: false, message: "The passphrases do not match." });
    expect(validateExportPassphrase("a long passphrase", "a long passphrase")).toEqual({ valid: true });
  });

  it("gives passphrase feedback without retaining the passphrase", () => {
    expect(exportPassphraseStrength("")).toMatchObject({ label: "Add passphrase", score: 0 });
    expect(exportPassphraseStrength("short")).toMatchObject({ label: "Too short", score: 0 });
    expect(exportPassphraseStrength("local archive passphrase")).toMatchObject({ label: "Fair", score: 2 });
    expect(exportPassphraseStrength("Longer Local Archive Passphrase 2026!")).toMatchObject({ label: "Strong", score: 3 });
  });

  it("stores an optional non-secret recovery hint outside the encrypted payload without accepting the passphrase itself", async () => {
    expect(validateExportRecoveryHint("my paper notebook", "a secure local passphrase")).toEqual({ valid: true, hint: "my paper notebook" });
    expect(validateExportRecoveryHint("a secure local passphrase", "a secure local passphrase")).toMatchObject({ valid: false });
    const archive = buildHomeLocalExportBundle("graph.json", '{"concepts":[]}', "graph.svg", "<svg></svg>");
    const protectedBundle = await buildPasswordProtectedExportBundle(archive, "graph.zip", "a secure local passphrase", "my paper notebook");
    expect(readProtectedExportRecoveryHint(protectedBundle)).toBe("my paper notebook");
  });
});
