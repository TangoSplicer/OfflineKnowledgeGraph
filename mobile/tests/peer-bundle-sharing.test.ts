import { vi, describe, expect, it } from "vitest";

import { exportPeerEncryptedBundle, mergePeerBundle, parseAndPreviewPeerBundle } from "../lib/peer-bundle-sharing";
import { concepts, connections } from "../lib/knowledge-data";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length + 11) % 256)),
}));

describe("direct encrypted peer bundle exchange", () => {
  it("exports an opaque bundle, previews it, and merges it with local data", async () => {
    const raw = await exportPeerEncryptedBundle(concepts.slice(0, 2), connections.slice(0, 1), "Research phone", "a secure peer passphrase");
    expect(raw).not.toContain(concepts[0].title);
    const preview = await parseAndPreviewPeerBundle(raw, "a secure peer passphrase", [concepts[0]], []);
    expect(preview.bundle.senderLabel).toBe("Research phone");
    expect(preview.preview.remoteConcepts).toBe(2);
    const merged = await mergePeerBundle(raw, "a secure peer passphrase", [concepts[0]], [], "merge");
    expect(merged.concepts).toHaveLength(2);
  });

  it("rejects an incorrect passphrase before any graph recovery", async () => {
    const raw = await exportPeerEncryptedBundle(concepts.slice(0, 1), [], "Research phone", "a secure peer passphrase");
    await expect(parseAndPreviewPeerBundle(raw, "a different passphrase", [], [])).rejects.toThrow("Unable to decrypt");
  });
});
