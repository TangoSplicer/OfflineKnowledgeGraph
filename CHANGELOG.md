# Changelog

Offline Knowledge Graph is maintained as a local-first knowledge-graph application with a Rust core, language bridges, and an Expo/React Native mobile client. This changelog groups the most meaningful published changes by capability area. It is a product history rather than a promise of semantic-version compatibility.

## Usability review fixes (unreleased, branch `fix/usability-review-2026-11-27`)

Fixes from a usability review of the mobile client, all on the current Expo SDK 54 / React Native 0.81 stack (no SDK upgrade):

- Capture now really saves: "Save concept locally" writes through the relationship store and only reports success after the write. Search now searches your own concepts (including archived, marked as such) instead of the five sample concepts.
- Home no longer shows the demo graph on an empty workspace, and the graph canvas no longer falls back to seeded sample data; concept screens show a proper not-found state for unknown ids instead of a sample concept.
- Graph layout is no longer hardcoded for the five demo nodes: a deterministic force-directed layout with collision-aware spacing replaces the demo position table, zoom now goes to 4.5x, and the focused node shows its full title.
- Explore opens as a clean graph with filters collapsed behind one Filter button; advanced controls live in a secondary panel, and empty states offer a next step.
- The first-concept and first-relationship wizards are merged into one honest 3-step flow with a single "Skip" wording.
- Backup and restore are unified on one screen: protected ZIP is the recommended path, plain JSON is explicitly advanced/unprotected, replace/clear need a typed confirmation, and a pre-restore snapshot is saved automatically so a bad restore can be undone.
- Library is grouped by task, a persistent "+" tab opens capture, accessibility labels and 44pt touch targets were added across the touched screens, small text was raised to 13-14pt, and the touched screens use theme tokens. Note: the light palette in `theme.config.js` still mirrors the dark palette, so light mode remains effectively dark until light values are designed.

## Current: Explore navigation and local record controls

The Explore canvas now supports **pinch-to-zoom** between 1× and 2.6×, bounded one-finger panning, double-tap reset, a visible zoom-level indicator, and a Reset view action. In the web build, focus the canvas to use arrow keys for panning, `+` or `−` for zoom, and `0` to recenter. These controls preserve node and relationship taps when the user is not dragging.

Export History now provides a two-step **Clear local history** action that removes only metadata stored on the device. It does not delete ZIP archives. Records can be retained at 3, 6, or 12 entries; searched by filename, date, or count; filtered by protection type; and sorted by newest archive, concept count, or relationship count.

| Commit | Change |
|---|---|
| `fb5ca13` | Added bounded pinch zoom, pan, reset view, and Explore canvas navigation guidance. |
| `913a0ef` | Added local history clearing, history sorting, and focused-neighborhood fit. |
| `5a20817` | Added history retention, search, protection filtering, and focused-label preview. |

## Local protection and recovery

Complete local exports package graph JSON with a graph image. The protected-export path derives a key with scrypt and encrypts the complete export package with XChaCha20-Poly1305 before sharing. The passphrase is never stored. Protected restore validates the archive locally, displays recovered counts, and requests biometric or device confirmation where available before replacement.

Recovery enhancements include optional non-secret recovery hints, passphrase-strength feedback, archive tamper rejection, wrong-passphrase rejection, and a locally scoped verified export history. The history intentionally excludes graph plaintext, passphrases, hints, and sharing destinations.

| Commit | Change |
|---|---|
| `80de40e` | Added recovery hints, verified export history, and label-density controls. |
| `65101a4` | Added protected local export recovery and biometric confirmation. |

## Local knowledge-work workflows

The mobile client includes an empty-workspace first-run experience, a guided first-concept wizard, a guided first-relationship editor, editable concept and relationship records, source references, relationship evidence, full-text search, tag clusters, local capture inboxes, graph narratives, evidence review, research questions, and transparent connection suggestions.

The app also supports complete JSON import and export, selective restore, focused knowledge-exchange bundles, nearby device-transfer fallbacks, local activity histories, archive and restore timelines, template management, and device-local maintenance prompts. These features operate without a mandatory account for core graph work.

## Engineering, Android delivery, and CI

The repository validates a native Rust knowledge-graph core and its Common Lisp FFI bridge alongside mobile source checks. The CI/CD pipeline runs linting, Expo configuration validation, TypeScript, deterministic Vitest suites, Android release APK assembly, and Maestro Android interaction flows. Common Lisp dependency installation is bounded to avoid indefinitely stalled package mirrors.

| Commit | Change |
|---|---|
| `6f4cae7` | Bounded SBCL installation and moved to a reliable Ubuntu mirror. |
| `057cc6a` | Added native CI coverage and large-graph performance benchmarks. |
| `04048e6` | Added guided onboarding, empty-workspace behavior, and verified APK CI delivery. |
| `ee99414` | Established the Rust core, language bridges, and CI/CD architecture. |

## Documentation policy

The canonical documentation set is intentionally small:

| Document | Purpose |
|---|---|
| [`README.md`](README.md) | Repository ownership, architecture, and start points. |
| [`mobile/README.md`](mobile/README.md) | Mobile product overview and development commands. |
| [`mobile/docs/USER_GUIDE.md`](mobile/docs/USER_GUIDE.md) | Detailed day-to-day user guide. |
| [`mobile/docs/LOCAL_PROTECTION_AND_RECOVERY.md`](mobile/docs/LOCAL_PROTECTION_AND_RECOVERY.md) | Security and recovery reference. |
| [`mobile/docs/VALIDATION_AND_PERFORMANCE.md`](mobile/docs/VALIDATION_AND_PERFORMANCE.md) | Engineering validation and performance reference. |
| [`USER_TASKS.md`](USER_TASKS.md) | Practical owner checklist for setup, protection, and release review. |

Historical internal implementation task logs and the superseded short tutorial have been removed from the repository to keep the published documentation focused on current product use and maintenance.
