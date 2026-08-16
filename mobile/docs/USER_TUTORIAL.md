# Offline Knowledge Graph: User Tutorial

## Start with one idea

Offline Knowledge Graph is designed to begin without an account and without preloaded personal data. On the Home screen, choose **Create your first concept**, give the idea a short title, add one working note, and create an optional first relationship. Every field remains editable later.

The simplest learning path is:

| Step | What to do | Where it leads |
|---|---|---|
| 1 | Capture one idea | Home → Create your first concept |
| 2 | Add one neighbor | Guided first-relationship editor |
| 3 | Explore the graph | Explore tab, paths, focus modes, and filters |
| 4 | Refine evidence | Concept details, Evidence Review, and Research Questions |
| 5 | Protect the graph | Library → backups, sync, and version history |

A demo graph is available for orientation, but it is optional. Loading it does not replace the value of creating a graph from your own material.

## Explore the graph

Use the **Explore** tab when you want to understand structure rather than edit one record. Search for concepts, filter by relationship type or tag, choose a layout, and tap a node or edge for details. Use focus mode to inspect a one-, two-, or three-hop neighborhood. Use path tools when you want to see how two concepts are connected through intermediate ideas.

Relationship details can include a note, evidence confidence, source URL, quotation, and the concepts at both endpoints. The graph canvas is a visual index; the written explanation in the graph overview describes the map in plain language.

## Use the Library as the control center

The **Library** tab contains maintenance and protection workspaces. It is the best place to continue after the first graph is useful.

| Need | Workspace |
|---|---|
| Review weak or unsupported links | Evidence Review |
| Capture raw notes before deciding where they belong | Capture Inbox |
| Organize a research topic | Research Questions |
| Export a focused bundle or readable report | Knowledge Exchange |
| Inspect tamper-evident sync history | Sync Audit Trail |
| Schedule encrypted backups | Automatic Encrypted Backups |
| Compare and restore retained encrypted revisions | Encrypted Version History |
| Pair a device before account-backed sync | Pair a Trusted Device |

## Protect a graph locally first

Manual JSON export remains available without login. It includes concepts, relationships, notes, tags, evidence fields, sources, and archive state. Restore uses a local preview before applying the selected concepts and endpoint-preserving relationships.

Automatic encrypted backups are optional. They require a user-held passphrase and a protected device key. The Home dashboard shows whether a schedule exists, how many schedules are active, the next run, and whether a previous run requires attention. When you want to verify an eligible schedule immediately, use **Run encrypted backup now**; the action keeps the same biometric gate, protected-key check, revision conflict protection, notifications, and audit entry as scheduled execution.

> Automatic backups are protection against loss, not a replacement for reviewing the graph. Keep a separate manual export when moving to a new device or changing your passphrase.

## Connect another device securely

Use **Library → Pair a Trusted Device** when a second device should become eligible for encrypted account sync.

For devices next to each other, choose **Local Wi-Fi** or **Bluetooth LE** in the adjacent pairing controls. The sender can advertise a 120-second identity token and the receiver can scan for nearby peers. The token is only a device identity; graph data and passphrases are not included. Use the explicit biometric confirmation before trusting the peer.

Knowledge Exchange also supports a direct encrypted backup bundle. Enter the shared passphrase, choose **Share nearby**, and let the receiving device choose **Find nearby**. Wi-Fi streams the opaque bundle through a short-lived local session authenticated by the pairing token. Bluetooth LE is available for smaller payloads; use Wi-Fi, QR, or the file-share fallback for larger graphs. The receiving device still decrypts locally and reviews merge, keep-local, or replace choices.

1. On the device being added, open the pairing screen and display its QR code.
2. On the device that will approve it, open the same screen and choose **Open QR scanner**.
3. Review the scanned label and platform. The token contains identity metadata only; it does not contain graph plaintext or a sync passphrase.
4. Confirm with biometric or device-passcode protection.
5. Share the sync passphrase separately through a trusted channel.
6. Use Complete-graph Sync, Selective Encrypted Sync, or Version Snapshots according to the task.

Revocation is available from the trusted-device sync screen. Revoking a device does not erase its local graph, but it prevents that device from using the account-backed encrypted sync routes until it is trusted again.

## Compare before restoring

Encrypted Version History retains up to ten recent opaque snapshots. Search the retained list by label, tag, or concept kind, select a snapshot, enter the sync passphrase, and choose **Decrypt & compare changes** before rollback. The app decrypts the snapshot locally and reports concept and relationship count changes, new records, removed records, and modified concepts.

Only after reviewing the diff should you choose **Confirm decrypt & restore locally**. For an easier recovery path, first create a current snapshot so you can return to the present graph.

## Understand sync boundaries

The server stores encrypted envelopes and limited metadata required for revision checks, lists, or device management. The passphrase and decrypted graph stay on the device. Complete-graph sync replaces or merges the whole graph according to an explicit recovery choice. Selective sync limits the envelope to chosen concepts and relationships whose endpoints are both included. Peer bundle exchange uses a password-protected local file and does not require server storage.

## A practical first session

Create one concept, add one relationship, and open Explore. Add a source or note to the relationship. Return to Library and inspect the Evidence Review workspace. When the graph contains information you would not want to recreate, export JSON manually. Only then consider signing in, pairing a second device, and enabling automatic encrypted backups.
