# Offline Knowledge Graph: Comprehensive User Guide

Offline Knowledge Graph is a **local-first** workspace for concepts, sources, relationships, evidence, and research questions. It helps you make the structure of your thinking visible without requiring a mandatory account for core work. Your graph remains on the device until you deliberately export or exchange a copy.

> Start with your own material. The optional demo graph is for evaluation only; it is never loaded automatically and does not replace a personal workspace.

Read [`AUDIENCE_AND_USE_CASES.md`](AUDIENCE_AND_USE_CASES.md) first if you are deciding whether the app fits your field or workflow.

## 1. What the app is designed to do

The app is useful when the relationship between ideas matters. A concept can represent a source, a claim, an observation, a person, a project, a system component, a theme, or an unresolved question. A relationship records why two concepts belong together. A clear note, source, quotation, and confidence cue make that relationship easier to revisit later.

| Area | Use it for | Outcome |
|---|---|---|
| Home | Start a graph, review activity, assess backup health, and create local exports. | A clear next action and a recovery point. |
| Explore | Search, filter, inspect, and navigate the visual graph. | Understanding of connections, clusters, and gaps. |
| Library | Maintain evidence, imports, exports, recovery, exchange, and focused local tools. | A safer and more trustworthy graph. |

## 2. First-time setup

When the workspace is empty, Home offers three intentional paths. Choose **Create your first concept** to start with your own material. Choose **I have a backup** when you are restoring a complete JSON graph and want to review the import preview first. Choose **Load demo graph** only when you want sample material for learning the interface.

The most useful first concept is specific enough to connect to evidence or a decision. A research workflow might start with a question; a technical workflow might start with a system boundary; a writing workflow might start with a theme, event, or source. Add a short working note in your own words and choose a concept kind that helps you scan the graph later.

## 3. Build an interpretable graph

After creating a concept, use **Manage relationships** to connect it to another concept. Select a relationship type, choose a strength, and write a note that explains the link. A relationship note should answer three practical questions: why the connection exists, what supports it, and what uncertainty remains.

| Element | Practical guidance |
|---|---|
| Concept title | Use a concise, distinguishable name. Prefer “2026 user interview finding” over “notes.” |
| Working note | Record context in your own words so the concept remains useful outside its original source. |
| Relationship type | Choose the label that most clearly explains the link, rather than the first available category. |
| Relationship note | Explain the reasoning behind the connection; do not rely on the visual line alone. |
| Source or quotation | Capture enough provenance to find and assess the original material later. |
| Confidence | Use it to signal how strongly the available evidence supports the relationship in your work. |

For a first graph, create three to five concepts and only the links you can explain. A smaller graph with meaningful notes is easier to improve than a dense graph of unexplained connections.

## 4. Search, filter, and explore

Explore supports quick lookup and structural investigation. Search looks through titles, notes, summaries, and tags; recent searches remain on the device. Filters can narrow the graph by tag, relationship type, evidence signal, or noted links. Tap a node to open its concept and tap a relationship to inspect its details.

| Control | What it does |
|---|---|
| Layout | Changes how the current graph is arranged. |
| Label density | Shows All labels, a representative Balanced set, or a Minimal anchor set for dense maps. |
| Focus mode | Limits the canvas to a selected concept and its one-, two-, or three-hop neighborhood. |
| Fit focused neighborhood | Switches a selected neighborhood to a compact radial one-hop view. |
| Focused label preview | Temporarily isolates the selected title without changing the saved density preference. |
| Tag, signal, and relationship filters | Narrow the graph to a theme, evidence condition, or relationship type. |

### Navigate a dense canvas

Pinch outward to zoom in and pinch inward to zoom out. Zoom is bounded from **1×** to **2.6×**. Drag with one finger to pan a magnified map. Movement is bounded so the graph stays reachable. Double-tap the canvas to return to the centered 1× view, or use **Reset view** below the canvas. The zoom percentage provides immediate feedback.

On the web build, focus the canvas before using **Arrow keys** to pan, **+** or **−** to change zoom, and **0** to reset. A normal single tap continues to open nodes or relationship details, so use a deliberate drag when you intend to pan.

## 5. Inspect evidence and improve weak links

Use **Evidence Review** in Library to find weak, unsupported, or uncited relationships. Use **Research Questions** to organize claims, counterpoints, sources, and unresolved gaps. These tools are prompts for review, not automatic judgements of truth.

A sustainable maintenance habit is to improve a few important links during each session. Add the reasoning and source behind the link, reduce its confidence when the support is weak, or remove it when it no longer reflects your understanding. The graph becomes more useful when its key relationships are explicit and traceable.

## 6. Use Library as a local control center

Library groups focused tools rather than returning you to a blank Home screen.

| Need | Where to go |
|---|---|
| Capture a raw thought before structuring it | Capture Inbox |
| Revisit weak or uncited links | Evidence Review |
| Organize claims and questions | Research Questions |
| Share a selected subset of the graph | Knowledge Exchange |
| Restore a standard complete graph backup | Local graph backup → Restore |
| Restore a protected complete graph | Restore protected export |
| Review archive metadata | Export history |
| Transfer selected protected bundles nearby | Nearby device transfer |

## 7. Create a complete local export

Home’s **Complete Local Export** creates a ZIP containing complete graph JSON and an SVG graph image. The card records only export metadata on the device and can remind you after meaningful graph edits. Use this ZIP as the basic recovery point for your personal graph.

Before the first successful export, Home displays a short **First local export** checklist. It confirms what the ZIP will contain, offers passphrase protection when needed, and provides the standard export action. The checklist disappears after a verified local export is recorded; **View verified history** remains available for later review.

When an archive is prepared, the **Local copy ready** sheet provides practical storage guidance. Move the ZIP out of a temporary download location, keep a second trusted copy when appropriate, and plan a recovery test. The sheet confirms that an archive was prepared; the device share sheet or browser download destination remains under your control.

### Read backup health honestly

Home’s **Backup health** card uses device-local export metadata to describe the newest verified export as current, due for review, stale, or missing. It does not inspect the actual archive file after the operating system share sheet closes, and it cannot verify a copy held in another app or cloud storage provider. Treat it as a reminder to review your own storage routine, not as proof that an external copy exists.

| Backup-health state | Suggested next action |
|---|---|
| Create a local copy | Use the export card to create the first ZIP. |
| Local copy looks current | Keep your chosen storage location and continue working. |
| Review your local copy | Export again after important changes or move the file to another trusted location. |
| Refresh your local copy | Create a fresh ZIP before relying on the graph for recovery. |

## 8. Protect sensitive exports

When an export contains sensitive material, enable **Passphrase protection** before creating the ZIP.

1. Enter and confirm a passphrase of at least 12 characters.
2. Read the strength feedback and choose a longer, more varied phrase when practical.
3. Optionally add a non-secret recovery hint. It can describe where a passphrase record is kept, but it must never repeat the passphrase.
4. Select **Export protected ZIP**.
5. Approve biometric or device-passcode confirmation when available.
6. Save or share the ZIP and communicate the passphrase through a separate trusted channel.

The protected ZIP contains authenticated encrypted package data rather than graph plaintext. The app derives protection locally and does not store, upload, or recover the passphrase. A non-secret hint can travel with an archive, but a hint that repeats the passphrase is rejected.

## 9. Review export history

Choose **View verified history** to see device-local metadata for recently prepared archives. History contains filename, protection type, graph counts, and creation time only. It does not retain the ZIP, passphrase, or share destination.

You can search history by filename, date, or count; filter complete versus protected archives; sort by newest archive, most concepts, or most links; and retain 3, 6, or 12 records. **Clear local history** requires a second confirmation and removes metadata only, never files that were already saved or shared elsewhere.

## 10. Test recovery deliberately

The **Restore confidence check** is optional and enabled by default once a local export exists. When due, select **Open recovery tools** to review the available recovery path. A safe test should use a copy you can afford to replace or a separate workspace. When the test is complete, select **I tested a restore** to record the completion locally. Turn the reminder off if it does not suit your workflow; this does not delete or modify any archive.

For a standard complete backup, use the JSON restore path and review its selective-import preview. For protected recovery, open **Library → Restore protected export**.

1. Select the intended protected ZIP.
2. Read the optional recovery hint if one is present.
3. Enter the original passphrase and verify the archive.
4. Compare the displayed concept and relationship counts with your expectations.
5. Export the current graph first if it matters.
6. Choose **Confirm and restore**, then complete native confirmation when requested.

Wrong passphrases, tampered ciphertext, malformed payloads, and invalid graph data are rejected before replacement. A failed restore leaves the current graph intact. There is no passphrase recovery mechanism by design.

## 11. Nearby and selective exchange

Use **Knowledge Exchange** for a deliberately selected subset of the graph. Nearby device transfer offers local Wi-Fi, Bluetooth LE, QR, and file-share fallbacks for explicitly selected protected bundles. Pairing data is short-lived identity and nonce information; it does not carry graph plaintext or a passphrase. Use a separate trusted channel for passphrases.

Before importing material from another person or device, review the selection and any conflict preview. Keep the source archive until you have confirmed that the imported concepts and relationships are the ones you intended to add.

## 12. Suggested routines by role

| Role | After each focused session | Weekly review | Periodic recovery check |
|---|---|---|---|
| Researcher or student | Add sources and explain the most important new links. | Review uncited claims and unanswered research questions. | Export after substantial changes and test recovery on a safe copy. |
| Product or technical practitioner | Record assumptions, decision rationale, and newly discovered dependencies. | Inspect focused neighborhoods around active work. | Export before a major change or device transition. |
| Writer, analyst, or creator | Capture new material and connect it to themes or projects. | Archive stale notes and strengthen the notes behind key connections. | Keep a protected archive separate from the working device when appropriate. |

For a maintainer-facing checklist, use [`../../USER_TASKS.md`](../../USER_TASKS.md).

## 13. Troubleshooting

| Problem | Recommended response |
|---|---|
| The graph is difficult to read | Use Balanced or Minimal labels, focus a concept, zoom and pan, or reset the canvas. |
| An export is absent from history | Confirm the archive completed successfully; history is metadata only and retains a bounded number of records. |
| Backup health does not match a file location | The card sees only local metadata. Confirm the actual ZIP using your storage application. |
| You cannot open a protected archive | Verify the selected file and original passphrase. Do not replace the current graph until counts are verified. |
| You forgot a protected-export passphrase | Consult the separate passphrase record. The archive cannot be decrypted without it. |
| You need engineering validation | Follow [`VALIDATION_AND_PERFORMANCE.md`](VALIDATION_AND_PERFORMANCE.md). |

For security boundaries and recovery details, read [`LOCAL_PROTECTION_AND_RECOVERY.md`](LOCAL_PROTECTION_AND_RECOVERY.md).
