# Offline Knowledge Graph: Detailed User Guide

Offline Knowledge Graph is a **local-first** workspace for ideas, sources, relationships, evidence, and research questions. You can create, search, explore, export, and restore your graph without a mandatory account. Your graph lives on the device until you deliberately export or exchange a copy.

> Start with your own information. The optional demo graph is available for exploration, but it is never loaded automatically and does not replace your data.

## 1. Learn the workspace

| Area | Use it for | Main outcome |
|---|---|---|
| Home | Start a graph, review activity, and create local exports. | A clear next action and a recovery point. |
| Explore | Search, filter, inspect, and navigate the visual graph. | Understanding of structure and relationships. |
| Library | Maintain evidence, imports, exports, recovery, and focused local tools. | A safer and more trustworthy graph. |

## 2. Begin with one useful concept

From Home, choose **Create your first concept**. Give the idea a concise title, add a working note in your own words, and select an appropriate kind. The guided flow can optionally help you create a first relationship. This is the quickest path to a useful empty workspace because it creates something you can search, edit, and connect immediately.

When you already have a complete JSON backup, select the restore path from the first-run screen instead. Review the import preview before confirming. If you are evaluating the product, choose **Load demo graph** deliberately; treat it as sample data rather than part of your workspace.

## 3. Create meaningful relationships

Open a concept and choose **Manage relationships** to connect it to another concept. Select the relationship type, strength, and an explanatory note. Add sources, quotations, or evidence-confidence information when the link represents a claim you may need to revisit.

Relationship notes make the graph interpretable. A relationship should explain why the connection exists, what evidence supports it, and what uncertainty remains. Strength describes how strongly the concepts are connected in your work; it is not an assertion of objective truth.

## 4. Search and explore your graph

The Explore screen is designed for both quick lookup and structural investigation.

| Control | What it does |
|---|---|
| Search | Finds concepts from titles, notes, summaries, and tags; recent searches remain available locally. |
| Layout | Changes the visual arrangement of the current graph. |
| Label density | Shows All labels, a representative Balanced set, or a Minimal anchor set for dense maps. |
| Focus mode | Limits the canvas to a selected concept and its one-, two-, or three-hop neighborhood. |
| Fit focused neighborhood | Sets a selected neighborhood to a compact radial one-hop view. |
| Tag, signal, and relationship filters | Narrow the graph to a theme, stronger/noted links, or a specific relationship type. |

### Navigate a dense graph canvas

The full Explore canvas supports direct navigation. Pinch outward to zoom in and pinch inward to zoom out; zoom is bounded from **1×** to **2.6×**. Drag with one finger to pan the magnified map. Movement is bounded so content stays reachable. Double-tap the canvas to return to the centered 1× view, or select **Reset view** beneath the canvas. The visible zoom percentage provides immediate feedback.

On the web build, first focus the canvas. Use **Arrow keys** to pan, **+** or **−** to change zoom, and **0** to reset. Normal single taps continue to open nodes or inspect relationship details, so use a deliberate drag when you intend to pan.

## 5. Inspect relationships and improve evidence

Tap a relationship line in Explore to view its endpoints, strength, evidence-confidence display, note, and available management action. Tap a node to open the concept itself. Use **Evidence Review** in Library to find weak, unsupported, or uncited relationships. Use **Research Questions** to organize claims, counterpoints, sources, and unresolved gaps.

For regular maintenance, prefer improving a few uncertain connections over adding many unexplained ones. A graph becomes more useful when its most important links have clear notes and sources.

## 6. Use Library as a local control center

Library groups focused tools rather than returning you to a blank home state.

| Need | Where to go |
|---|---|
| Capture a raw thought before structuring it | Capture Inbox |
| Revisit weak or uncited links | Evidence Review |
| Organize claims and questions | Research Questions |
| Share only a selected part of the graph | Knowledge Exchange |
| Restore a standard complete graph backup | Local graph backup → Restore |
| Restore a protected complete graph | Restore protected export |
| Review archive creation metadata | Export history |
| Transfer selected protected bundles nearby | Nearby device transfer |

## 7. Export a complete local copy

Home’s **Complete Local Export** creates a ZIP with complete graph JSON and an SVG graph image. The card records the latest successful export and can remind you after meaningful graph edits. Use this export for your normal personal backup routine.

Choose **View verified history** to see device-local metadata for recently prepared archives. The history includes filename, protection type, graph counts, and creation time only. Search by filename, date, or count; filter protected versus complete archives; sort by newest archive, most concepts, or most links; and retain 3, 6, or 12 records. **Clear local history** requires a second confirmation and removes only metadata, never the ZIP files themselves.

## 8. Protect sensitive exports with a passphrase

When an exported graph contains sensitive material, turn on **Passphrase protection** before creating the ZIP.

1. Enter and confirm a passphrase of at least 12 characters.
2. Read the strength feedback and choose a longer, more varied phrase if practical.
3. Optionally add a non-secret recovery hint. It can describe where you kept the passphrase, but it must not repeat the passphrase.
4. Select **Export protected ZIP**.
5. Approve the biometric or device-passcode confirmation when available.
6. Save or share the ZIP and communicate the passphrase through a separate trusted channel.

The protected ZIP contains authenticated encrypted package data rather than graph plaintext. The app derives protection from the passphrase locally and does not store, upload, or recover that passphrase.

## 9. Restore safely

For a standard complete backup, use the JSON restore path and review its selective-import preview. For protected recovery, open **Library → Restore protected export**.

1. Select the intended protected ZIP.
2. Read the optional recovery hint if present.
3. Enter the original passphrase and verify the archive.
4. Compare the displayed concept and relationship counts with your expectations.
5. Export your current graph first if it matters.
6. Choose **Confirm and restore**, then complete native confirmation if requested.

Wrong passphrases, tampered ciphertext, malformed payloads, and invalid graph data are rejected before replacement. A failed restore leaves the current graph intact. There is no passphrase recovery mechanism by design.

## 10. Nearby and selective exchange

Use **Knowledge Exchange** for a deliberately selected subset of your graph. Nearby device transfer offers local Wi-Fi, Bluetooth LE, QR, and file-share fallbacks for explicitly selected protected bundles. Pairing data is short-lived identity and nonce information; it does not carry your graph plaintext or your passphrase. Use a separate trusted channel for passphrases.

## 11. A sustainable routine

After a meaningful session, create a local export. Once a week, review Evidence Review and Research Questions, then add sources or revise uncertain links. Once a month, explore the full graph with labels reduced, focus important neighborhoods, and identify isolated ideas or missing connections. Use the owner checklist in [`../../USER_TASKS.md`](../../USER_TASKS.md) to make the routine repeatable.

## 12. Troubleshooting

| Problem | Recommended response |
|---|---|
| The graph is difficult to read | Use Balanced or Minimal labels, focus a concept, zoom and pan, or reset the canvas. |
| An export does not appear in history | Confirm the archive completed successfully; history is metadata only and retains a bounded number of records. |
| You cannot open a protected archive | Verify the selected file and original passphrase. Do not replace the current graph until counts are verified. |
| You forgot a protected-export passphrase | Consult your separate passphrase record. The archive cannot be decrypted without it. |
| You need engineering validation | Follow [`VALIDATION_AND_PERFORMANCE.md`](VALIDATION_AND_PERFORMANCE.md). |

For the full security model and recovery boundaries, read [`LOCAL_PROTECTION_AND_RECOVERY.md`](LOCAL_PROTECTION_AND_RECOVERY.md).
