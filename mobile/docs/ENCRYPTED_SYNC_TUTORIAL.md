# Encrypted Sync Tutorial

## Security model in one paragraph

Offline Knowledge Graph uses a local-first model. Core graph work does not require login. When cross-device features are enabled, the app encrypts graph and feedback payloads on the device before sending opaque envelopes to the authenticated storage service. The user-held passphrase is used locally and is never uploaded. Biometric or device-passcode confirmation protects sensitive recovery, upload, deletion, device trust, and rollback actions on supported native devices.

## Choose the right protection path

| Situation | Recommended path | Why |
|---|---|---|
| One-time manual transfer | JSON export or password-protected peer bundle | No account or server storage is required |
| A focused research collection | Selective Encrypted Sync | Only chosen concepts and endpoint-preserving relationships are included |
| A second personal device | QR pairing, then Complete-graph Sync | Device identity is reviewed before encrypted envelopes are shared |
| Recovery from accidental edits | Encrypted Version History | Compare a decrypted snapshot locally before rollback |
| Routine protection | Automatic Encrypted Backups | The device runs a user-managed daily or weekly schedule |

## QR and adjacent trusted-device pairing

Trusted-device pairing establishes a verified device identity so account-backed encrypted synchronization can recognize authorized hardware. Pairing tokens contain identity metadata only (version, scope, device identifier, label, platform, transport, nonce, creation time, and expiry). They never contain graph plaintext, encrypted envelopes, or a sync passphrase.

### Adjacent Wi-Fi and Bluetooth exchange

For devices in physical proximity, open **Library → Pair a Trusted Device** and choose between **Local Wi-Fi** and **Bluetooth LE** in the adjacent exchange card.
- **Advertise nearby**: Publishes an ephemeral two-minute pairing token over the selected local transport.
- **Find nearby**: Scans for adjacent devices advertising valid pairing tokens.
- **Review and trust**: Tap a discovered peer to inspect its identity, verify its platform and transport, and confirm trusted-device enrollment with biometric or device-passcode protection.

Ephemeral tokens have a strict 120-second TTL and incorporate nonce-based replay prevention so captured tokens cannot be reused.

### Direct nearby encrypted backup bundles

After entering the shared passphrase, choose **Local Wi-Fi** or **Bluetooth LE** in **Knowledge Exchange**. On the sending device, choose **Share nearby**. The receiving device chooses **Find nearby**, reviews the sender label and transport, and taps the discovered device to fetch the bundle. The passphrase is never sent over the radio. Wi-Fi transfers use a short-lived local TCP session authenticated by the ephemeral pairing token; Bluetooth LE advertises the bundle only when it fits the platform’s characteristic limit, otherwise use Wi-Fi, QR, or the encrypted file share fallback. Recovery still requires a local decrypt, conflict preview, and explicit merge, keep-local, or replace choice.

### QR fallback and manual review

When adjacent radio discovery is unavailable (such as in web preview or restricted sandbox environments), display the QR code on the target device or paste a manual pairing token for local inspection and approval.

### Revocation

If a device is lost or decommissioned, open Complete-graph Sync or trusted-device settings and choose **Revoke**. Revocation blocks future authenticated envelope access for that device. It does not erase local data from the device itself.

## Complete-graph and selective sync

Complete-graph sync contains active and archived concepts, relationships, tags, notes, evidence, and source context. When a remote revision is newer, the app refuses automatic overwrite and asks you to download, decrypt, and choose a recovery path.

Selective Encrypted Sync creates an independently revisioned envelope for a chosen subset. A relationship is included only when both endpoints are selected. The preview shows the expected concept and relationship counts before upload or recovery.

## Peer bundle exchange

Knowledge Exchange can create a password-protected local bundle for a small, intentional transfer. Choose concepts, enter a passphrase of at least twelve characters, and select **Export encrypted**. Share the file through the native share sheet and communicate the passphrase separately.

The receiving device chooses **Import & review**, enters the passphrase, and reviews the local conflict preview. Recovery choices are explicit: merge, keep local, or replace local. A failed passphrase never changes the local graph.

## Encrypted snapshots and diff review

Version History retains up to ten recent encrypted graph snapshots. A snapshot contains an encrypted graph envelope plus non-sensitive list metadata such as label, source revision, and record counts.

To review a snapshot:

1. Open **Library → Encrypted Version History**.
2. Select a retained snapshot.
3. Enter the passphrase and choose **Decrypt & compare changes**.
4. Review local-versus-snapshot counts for concepts and relationships, along with new, removed, and modified record counts.
5. If the snapshot is appropriate, choose **Confirm decrypt & restore locally** and complete the sensitive-action confirmation.

The diff is calculated after local decryption. The server does not receive the plaintext comparison. Snapshot history can be searched by label, tag, or concept kind using non-sensitive metadata. Create a current snapshot before rollback when you want an easy return point.

## Automatic backup schedules and notifications

Automatic backups are opt-in and user-managed. Choose daily or weekly frequency, select a UTC hour, and enroll a protected backup key with a passphrase of at least twelve characters. The app pauses a schedule after an execution failure or a newer remote revision conflict rather than silently overwriting data.

On Android, local notification cues can report completion, a paused schedule, or a revision conflict. Notifications contain a short status and a route back to backup controls; they do not contain graph plaintext, passphrases, or encrypted envelope contents. The Home dashboard also shows the current number of active schedules, the next run, and the latest attention message. Use **Run encrypted backup now** when you want to verify an eligible schedule immediately; it still uses the normal biometric gate, protected key, revision check, and audit trail.

## Live encryption and sync progress

Sensitive sync actions now display a compact, accessible progress panel instead of leaving the user at a static button. The panel reports the current protective stage and a conservative completion indicator. It is intentionally a status model rather than a byte-level transfer meter, because the work includes local key access, encryption, revision checks, and snapshot persistence in addition to network transfer.

| Status | What the app is doing | What you should do |
|---|---|---|
| Authorizing | Requesting biometric or device-passcode approval and unlocking a protected local key. | Confirm only if the device and intended backup are correct. |
| Fetching | Reading the opaque remote revision needed for safe conflict checks. | Keep the app open while the revision check completes. |
| Encrypting | Creating the encrypted graph envelope on this device. | Graph text and the passphrase remain local during this stage. |
| Uploading | Sending only the encrypted envelope to the configured protected storage. | Do not close the app until a completion, review, or error status appears. |
| Verifying | Saving a protected local snapshot and audit information. | Wait for the final completion status. |
| Review or error | A newer remote revision, unavailable key, or another recoverable issue needs attention. | Open the provided review controls; automatic backup never silently overwrites a newer revision. |

The same panel appears for complete-graph sync, selective sync, and Home’s manual encrypted-backup quick run. A completed panel confirms that the encrypted operation reached its terminal state; it does not disclose graph contents, passphrases, or envelope material.

## Recovery checklist

Before recovering any encrypted data, verify the device label, confirm that the passphrase belongs to the intended graph, review the diff or conflict preview, and ensure that the selected recovery action is explicit. If the graph is important, create a fresh local JSON export and a current encrypted snapshot first.
