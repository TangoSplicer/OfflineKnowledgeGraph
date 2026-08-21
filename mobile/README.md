# Offline Knowledge Graph

Offline Knowledge Graph is a **fully local-first** Expo mobile application for capturing concepts, connecting relationships, exploring evidence, and maintaining a personal knowledge graph. Core work, backup, restore, search, and graph exploration require **no account and no network connection**.

## Start here

Create your first concept from Home, add a working note, and make an optional connection. The complete walkthrough is in [docs/USER_TUTORIAL.md](docs/USER_TUTORIAL.md).

When the graph contains work you would not want to recreate, use Home’s **Complete Local Export**. It creates a ZIP containing the complete JSON graph and an SVG graph image. Turn on **Passphrase protection** to create a protected ZIP that can be restored only inside Offline Knowledge Graph with the same passphrase. You may add a non-secret recovery hint, which travels with the archive but is rejected if it matches the passphrase. Read [docs/LOCAL_PROTECTION_AND_RECOVERY.md](docs/LOCAL_PROTECTION_AND_RECOVERY.md) for the exact protection and recovery flow.

## Core product principles

| Principle | Meaning |
|---|---|
| Local-first | Capture, editing, search, graph exploration, export, and restore work from the device. |
| User-held protection | Protected exports use a passphrase entered only for that action; the app never stores it. |
| Explicit recovery | A protected archive is decrypted, inspected, and confirmed before it replaces a local graph; an optional non-secret hint can help identify the passphrase without revealing it. |
| Biometric confirmation | Native devices request biometric or device-passcode confirmation before protected export sharing and protected restore. |
| Transparent intelligence | Connection suggestions use inspectable local signals and require confirmation. |

## Main workspaces

**Home** starts a new graph, shows graph activity, exports a complete local ZIP, records bounded verified export metadata, and can remind you after meaningful edits. **Explore** provides searchable graph layouts, readable node titles, **All labels / Balanced / Minimal** density controls, a one-tap focused-label preview for dense maps, and **Fit focused neighborhood**, which resets the selected idea to a compact radial one-hop view. The full Explore canvas supports native pinch-to-zoom and one-finger panning, with a **Reset view** control to return to the default centered scale. **Library** keeps maintenance and recovery tools together, including **Export history** with local retention, filename search, protection filtering, newest/concept/link sorting, and a two-step local metadata clearing action that never deletes archive files; **Restore protected export**; ordinary JSON import; local backup routines; nearby transfer; and Knowledge Exchange.

## Protected export format

A standard local export ZIP contains the graph JSON and an SVG image. A **protected** export ZIP contains an authenticated encrypted payload plus a recovery note; graph plaintext is not placed in the outer archive. If chosen, the outer ZIP also contains a non-secret recovery-hint text file. The hint must not be the passphrase. The payload is derived from the user’s passphrase with scrypt and protected with XChaCha20-Poly1305 on-device. It is restored through **Library → Restore protected export**.

> Keep the passphrase somewhere you control. It is never uploaded or saved by the app, so it cannot be recovered by Offline Knowledge Graph.

## Development

This project uses Expo SDK 54, React Native 0.81, React 19, TypeScript, Expo Router, NativeWind, and Vitest.

```bash
pnpm install
pnpm check
pnpm lint
pnpm test -- --run
pnpm dev
```

Pull requests run linting, Expo configuration validation, TypeScript, the deterministic Vitest suite, Android APK assembly, and Android interaction flows. See [docs/VALIDATION_AND_PERFORMANCE.md](docs/VALIDATION_AND_PERFORMANCE.md) for the current validation matrix and performance limits.
