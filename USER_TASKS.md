# Owner Task List

This checklist is for the person maintaining or using Offline Knowledge Graph. The app is local-first: you can complete core work without an account or a network connection. Mark items as you complete them in your own copy of this file if that is useful.

## First-time setup

| Task | Why it matters | Done |
|---|---|---|
| [ ] Create your first concept or restore a known complete backup. | Establishes your personal workspace without loading the optional demo graph. | |
| [ ] Add at least one relationship and one source or note. | Confirms that your graph records useful context, not only titles. | |
| [ ] Open Explore and try search, focus mode, and label density. | Confirms that the map is usable at the density of your own data. | |
| [ ] Pinch to zoom, drag to pan, and use Reset view. | Confirms that you can inspect dense neighborhoods. | |
| [ ] If using the web build, focus the canvas and try arrow keys, `+`, `−`, and `0`. | Confirms keyboard navigation is available. | |

## Protect your knowledge graph

| Task | Why it matters | Done |
|---|---|---|
| [ ] Create a complete local export after meaningful work. | Provides a portable recovery point containing graph JSON and an SVG graph image. | |
| [ ] For sensitive data, create a protected ZIP with a unique passphrase of at least 12 characters. | Keeps graph plaintext out of the shared archive. | |
| [ ] Store the passphrase in a system you control, separate from the ZIP. | The app cannot recover a forgotten passphrase. | |
| [ ] Add a non-secret recovery hint only if it helps you identify your passphrase system. | A hint must never be the passphrase itself. | |
| [ ] Test protected restore with a spare archive before relying on it. | Verifies your archive, passphrase, and recovery routine. | |

## Regular maintenance

| Cadence | Task | Done |
|---|---|---|
| After a focused work session | Export a complete ZIP or protected ZIP. | |
| Weekly | Open Evidence Review and Research Questions; strengthen, cite, archive, or remove weak links. | |
| Weekly | Review Export History. Sort by newest or by graph size, then confirm the local retention limit fits your needs. | |
| Monthly | Open Explore at full graph scale. Use focus mode and the graph narrative to identify unconnected clusters or missing relationships. | |
| Before sharing | Use Knowledge Exchange or a deliberately chosen export; share a protected ZIP passphrase through a separate trusted channel. | |

## Before publishing a repository change

| Task | Command or check | Done |
|---|---|---|
| [ ] Install exact mobile dependencies. | `cd mobile && pnpm install --frozen-lockfile` | |
| [ ] Run source and configuration checks. | `pnpm lint && npx expo config --type public && pnpm check` | |
| [ ] Run deterministic tests. | `pnpm test -- --run` | |
| [ ] Review user documentation. | Confirm README links, USER_GUIDE, protection guide, validation guide, changelog, and this checklist match the feature. | |
| [ ] Review the GitHub Actions run. | Confirm the Rust/Common Lisp FFI, Android APK, and Maestro jobs are green. | |
| [ ] Download and test the Android artifact when preparing a release. | Install the release APK on a suitable test device before distribution. | |

## If something goes wrong

| Situation | First action |
|---|---|
| You cannot locate a previous export. | Review Export History for filename and creation time; the history does not retain the archive file itself. |
| A protected archive will not open. | Verify that you selected the correct file and use the original passphrase exactly; do not repeatedly replace the current graph. |
| You forgot a protected-export passphrase. | Look for your separate passphrase record or recovery system. The archive cannot be decrypted without it. |
| The graph looks crowded. | Choose Balanced or Minimal labels, focus an idea, use Fit focused neighborhood, or zoom and pan the canvas. |
| An Android build fails. | Read the failing CI job, reproduce the relevant local command, and preserve the failing artifact or Maestro evidence before changing code. |
