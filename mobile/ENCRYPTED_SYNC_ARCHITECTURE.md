# Encrypted Feedback Sync Architecture

## Scope and Trust Boundary

Cross-device synchronization applies only to the **connection-suggestion feedback profile**. The account service identifies the profile owner and stores one opaque encrypted envelope. The service must never receive the feedback events, reasons, signal weights, or the user-held sync passphrase.

| Component | Stores or processes | Must not receive |
|---|---|---|
| Local device | Plain feedback profile, passphrase-derived key in memory, decrypted merge candidate | Other users’ records |
| Authenticated sync service | Account ID, envelope version, revision, upload timestamp, salt, nonce, ciphertext | Passphrase, derived key, plaintext feedback |
| User-held recovery material | Sync passphrase and optional encrypted profile export | Server-side recovery key |

## Envelope Format

The client derives a 32-byte key using **scrypt** from a user-entered sync passphrase and a random per-profile salt. It encrypts the serialized feedback profile with **XChaCha20-Poly1305** using a fresh random 24-byte nonce. The encrypted format is versioned so future formats can be rejected safely rather than guessed.

```ts
type EncryptedFeedbackEnvelope = {
  schemaVersion: 1;
  cipher: "xchacha20poly1305";
  kdf: { name: "scrypt"; N: 32768; r: 8; p: 1; salt: string };
  nonce: string;
  ciphertext: string;
};
```

The server saves this envelope verbatim alongside a monotonic revision number. The passphrase is intentionally not recoverable by the server. A user who loses it can still continue from an existing device or a manually exported profile, but cannot decrypt an older remote-only envelope.

## Synchronization Protocol

1. The user signs in with their account and enters the same sync passphrase on each device.
2. The device downloads and decrypts the encrypted envelope, if one exists.
3. The device merges feedback events locally by suggestion ID, retaining the newest event per suggestion.
4. The device encrypts the merged profile with a new nonce and uploads it with its last known server revision.
5. The server accepts the upload only when the expected revision matches. Otherwise it returns a conflict response without exposing plaintext.
6. On a conflict, the client downloads, decrypts, and presents local, remote, and merged outcome counts. The user explicitly chooses merge, keep local, or keep remote before a new upload attempt.

## Recovery and Security Controls

Sync is always opt-in. The app presents the passphrase requirement before enabling sync and never stores the plaintext passphrase. A separate local encrypted-profile export remains available for manual recovery. Resetting local feedback does not delete the remote envelope; remote deletion requires an explicit authenticated action.

The implementation uses authenticated encryption so any tampered ciphertext fails decryption. All network operations are authenticated, and server procedures are restricted to the signed-in account that owns the record.
