# Local Protection and Recovery Tutorial

## Security model

Offline Knowledge Graph keeps graph work on the device. Creating concepts, editing relationships, exploring the graph, exporting, and restoring do not require an account. Protected export is also local: the app derives a key from the passphrase with **scrypt**, encrypts the complete export package with **XChaCha20-Poly1305**, and shares only the resulting protected archive.

The passphrase is entered for the action, kept in memory only while needed, and cleared after successful export or restore. It is never uploaded, stored, or recoverable by the app.

## Choose the right protection path

| Situation | Recommended path | Why |
|---|---|---|
| Routine local copy | Home → Export ZIP | Includes complete JSON graph data and an SVG graph image. |
| Sensitive or portable complete copy | Home → Passphrase protection → Export protected ZIP | Protects graph plaintext with a user-held passphrase before sharing. |
| Restore a protected complete copy | Library → Restore protected export | Decrypts and validates locally before explicit replacement. |
| Focused collaboration | Knowledge Exchange | Shares only a deliberately selected graph subset. |
| Nearby device transfer | Nearby device transfer | Uses local Wi-Fi, Bluetooth LE, QR, or file-share fallback. |
| Routine device-local protection | Local backup routines | Creates user-managed protected local snapshots. |

## Create a protected ZIP

1. Open Home and find **Complete Local Export**.
2. Turn on **Passphrase protection**.
3. Use at least 12 characters, confirm the passphrase, and review the strength feedback.
4. Choose **Export protected ZIP**.
5. Approve the biometric or device-passcode confirmation on supported native devices.
6. Save the archive through the share sheet and communicate the passphrase separately.

The resulting ZIP is a recovery container. Its outer layer contains the encrypted payload and a short recovery note, not graph plaintext. Restore it through Offline Knowledge Graph rather than expecting another ZIP viewer to expose the graph files.

## Restore a protected ZIP safely

1. Open **Library → Restore protected export**.
2. Enter the same passphrase used at export time.
3. Choose the protected ZIP from device storage.
4. Review the verified concept and relationship counts.
5. Export the current graph first if you may need to return to it.
6. Choose **Confirm and restore** and approve the native device confirmation.

Wrong passphrases, modified ciphertext, missing encrypted payloads, and malformed graph data are rejected before the graph is replaced. A failed decryption leaves the current local graph unchanged.

## Biometric and device confirmation

Protected export sharing and protected restore request a native biometric confirmation whenever strong enrolled biometrics are available. If the device does not provide enrolled biometrics, the app uses the user-entered passphrase and device fallback behavior instead of preventing access to the owner’s local graph. Browser preview relies on the entered passphrase because native biometrics are unavailable there.

## Nearby transfer boundaries

Nearby pairing and local exchange are optional. Discovery tokens contain short-lived device identity data and a nonce; they do not include graph plaintext or a passphrase. Local Wi-Fi and Bluetooth LE transports carry only explicitly selected, already-protected bundles. Use QR or file sharing when radio discovery is unavailable.

## Recovery checklist

Before restoring any archive, verify the expected filename and source, confirm that you know the correct passphrase, compare the verified concept and relationship counts with your expectations, make a fresh local export if the current graph matters, and confirm replacement only on the intended device.

> There is no passphrase recovery path. If you lose the passphrase, the protected archive remains unreadable by design.
