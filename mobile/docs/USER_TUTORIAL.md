# Offline Knowledge Graph: User Tutorial

## Start with one idea

Offline Knowledge Graph begins with a blank local workspace. On Home, choose **Create your first concept**, give the idea a concise title, add a working note, and create an optional first relationship. Every field remains editable later, and nothing requires an account.

| Step | What to do | Where it leads |
|---|---|---|
| 1 | Capture one idea | Home → Create your first concept |
| 2 | Add one neighbor | Guided first-relationship editor |
| 3 | Explore the graph | Explore tab, paths, focus modes, and filters |
| 4 | Refine evidence | Concept details, Evidence Review, and Research Questions |
| 5 | Protect your work | Home export and Library recovery tools |

A demo graph is available only when you choose **Load demo graph**. It is optional and never replaces your own data automatically.

## Explore the graph

Use **Explore** to understand structure rather than edit one record. Search for concepts, filter by relationship type or tag, choose a layout, and use focus mode to inspect a one-, two-, or three-hop neighborhood. For larger maps, choose **All labels**, **Balanced**, or **Minimal** in the filter panel. Balanced keeps a representative set of titles visible; Minimal keeps the focused title, or one anchor, while every node remains tappable. After choosing a focus idea, use **Preview focused label** below the canvas for a one-tap view that temporarily shows only that title without changing your saved density choice. Use **Fit focused neighborhood** to reset the selected idea to a compact radial one-hop view for quick local inspection.

Relationship details can include a note, evidence confidence, source URL, quotation, and both endpoints. The graph overview describes the current map in plain language.

## Use the Library as the control center

Library keeps local maintenance and recovery work in focused sections.

| Need | Workspace |
|---|---|
| Review weak or unsupported links | Evidence Review |
| Capture raw notes before promoting them | Capture Inbox |
| Organize claims, sources, and open gaps | Research Questions |
| Export a focused bundle or readable report | Knowledge Exchange |
| Review locally created archive metadata | Export history |
| Restore a passphrase-protected complete export | Restore protected export |
| Import a standard complete graph backup | Local graph backup → Restore |
| Share with a nearby device | Nearby device transfer |
| Schedule protected local snapshots | Local backup routines |

## Export a complete local copy

Home’s **Complete Local Export** creates a ZIP containing:

| File | Purpose |
|---|---|
| Complete graph JSON | Concepts, relationships, notes, tags, sources, evidence, and archive state. |
| SVG graph image | A readable visual map of the exported graph. |

The Home card records the last successful local export and can remind you after five meaningful graph changes. **View verified history** opens a short local record of archive filename, protection type, graph counts, and creation time. Search by filename, date, or recorded count; filter to protected or complete ZIPs; sort by newest archive, most concepts, or most links; and choose whether this device retains the latest 3, 6, or 12 local records. When you no longer need the record, select **Clear local history** and then confirm; this removes only the on-device metadata, not any ZIP files you previously created or shared. The history keeps no graph copy, passphrase, recovery hint, or information about where a file was later shared. You can turn reminders off without disabling export.

## Protect an export with a passphrase

Turn on **Passphrase protection** in the Home export card when the graph should not be readable by anyone who receives the shared file.

1. Enter a passphrase of at least 12 characters and confirm it.
2. Read the on-screen strength feedback. A longer phrase with more character variety is stronger.
3. Optionally add a **recovery hint** that helps you recognize the passphrase source. Never write the passphrase itself; the app will reject an exact match.
4. Choose **Export protected ZIP**.
5. Confirm the native biometric or device-passcode prompt when it is available.
6. Save or share the resulting ZIP, then communicate the passphrase separately through a trusted channel.

The graph plaintext is encrypted on this device before the protected ZIP is shared. The passphrase is not stored, sent, or recoverable. Keep it somewhere you control.

## Restore a protected export

Open **Library → Restore protected export**. First choose the protected ZIP. If its creator added one, the app shows the non-secret recovery hint before you enter the original passphrase. The app decrypts and validates the archive locally, then shows its concept and relationship counts before recovery.

> Confirming restore replaces the current graph on this device. Review the displayed counts, export your current graph first if it matters, and complete the device confirmation only when the selected archive is correct.

## Optional nearby exchange

For nearby devices, **Knowledge Exchange** and **Nearby device transfer** support local Wi-Fi, Bluetooth LE, QR, and file-share fallbacks. Pairing information contains short-lived device identity data only; it never contains graph text or your passphrase. Use a separate trusted channel for passphrases.

## A practical first session

Create one concept, add one relationship, and open Explore. Add a source or note to a link, then return Home and make a complete local export. When the graph becomes sensitive or valuable, switch on passphrase protection and test a restore on a spare copy before relying on it for recovery.
