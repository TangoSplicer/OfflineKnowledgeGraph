import { vi , describe, expect, it } from "vitest";


import { decryptFeedbackProfile, encryptFeedbackProfile, previewSyncConflict, resolveSyncConflict } from "../lib/encrypted-feedback-sync";
import { appendSuggestionFeedback, emptySuggestionFeedback } from "../lib/suggestion-feedback";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => Uint8Array.from({ length }, (_, index) => (index + length) % 256)),
}));

describe("encrypted feedback sync envelope", () => {
  it("encrypts feedback into an opaque envelope and decrypts it only with the same passphrase", async () => {
    const feedback = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-tags"], reason: "matches-judgment" }, 1);
    const envelope = await encryptFeedbackProfile(feedback, "a secure sync passphrase");
    expect(envelope).toMatchObject({ schemaVersion: 1, cipher: "xchacha20poly1305", kdf: { name: "scrypt", N: 32768 } });
    expect(envelope.ciphertext).not.toContain("candidate-a");
    await expect(decryptFeedbackProfile(JSON.stringify(envelope), "a secure sync passphrase")).resolves.toEqual(feedback);
    await expect(decryptFeedbackProfile(JSON.stringify(envelope), "another secure passphrase")).rejects.toThrow("Unable to decrypt");
  });

  it("keeps merge, local, and remote conflict choices explicit", () => {
    const local = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "accepted", signals: ["shared-tags"] }, 1);
    const remote = appendSuggestionFeedback(emptySuggestionFeedback(), { suggestionId: "candidate-a", outcome: "dismissed", signals: ["same-kind"] }, 2);
    expect(previewSyncConflict(local, remote)).toEqual({ localEvents: 1, remoteEvents: 1, mergedEvents: 1 });
    expect(resolveSyncConflict(local, remote, "merge").events[0].outcome).toBe("dismissed");
    expect(resolveSyncConflict(local, remote, "local")).toEqual(local);
    expect(resolveSyncConflict(local, remote, "remote")).toEqual(remote);
  });
});
