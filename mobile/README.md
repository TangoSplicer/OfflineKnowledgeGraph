# Offline Knowledge Graph

Offline Knowledge Graph is a local-first Expo mobile application for capturing concepts, connecting relationships, exploring evidence, and maintaining a personal knowledge graph without mandatory login.

## Start here

The in-app first-run wizard is the shortest path: create one concept, add a note, and make one optional connection. For the complete user journey, read [docs/USER_TUTORIAL.md](docs/USER_TUTORIAL.md).

For cross-device protection, read [docs/ENCRYPTED_SYNC_TUTORIAL.md](docs/ENCRYPTED_SYNC_TUTORIAL.md). It explains QR and adjacent Wi-Fi/Bluetooth trusted-device pairing, direct password-protected bundle transfer, complete and selective encrypted sync, snapshot diff review and filters, automatic backup schedules, live quick-run progress, and notification boundaries.

## Core product principles

| Principle | Meaning |
|---|---|
| Local-first | Core capture, editing, search, graph exploration, and manual JSON backup work without login. |
| User-held encryption | Sync passphrases remain with the user and are used on-device. |
| Explicit recovery | Conflicts, imports, peer bundles, and snapshot rollbacks require review and a deliberate choice. |
| Transparent intelligence | Connection suggestions use inspectable local signals and require confirmation. |
| Reviewable automation | Automatic backups are opt-in, pausable, bounded by revision checks, and visible in the audit trail. |

## Main workspaces

The Home screen is the starting point. Its backup card shows the next scheduled run and provides an explicit, biometric-gated quick-run action. Explore provides graph search, filters, focus neighborhoods, layouts, paths, and written graph explanations. Library contains evidence review, capture, research, Knowledge Exchange with adjacent encrypted bundle transfer, sync audit, automatic backups, selective sync, version history with tag/kind filters, and trusted-device pairing.

## Development

This project uses Expo SDK 54, React Native 0.81, React 19, TypeScript, Expo Router, NativeWind, tRPC, Drizzle, and Vitest.

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

Pull requests run linting, Expo configuration validation, TypeScript, the complete Vitest suite, an Android debug build, and deterministic Android interaction flows. The native flows and reproducible large-graph benchmark limits are documented in [docs/VALIDATION_AND_PERFORMANCE.md](docs/VALIDATION_AND_PERFORMANCE.md).

The web preview is useful for interface review. Camera scanning, biometric confirmation, local Wi-Fi discovery, Bluetooth LE transport, and direct bundle streaming are native development-build capabilities and should be validated in the Android build. The web pairing and exchange screens provide manual token, QR, and encrypted-file fallback paths for development.

## Security notes

Graph plaintext is encrypted before account-backed upload. Server-side records are opaque envelopes plus the minimum metadata needed for authenticated revision checks, device management, listing, and recovery controls. A QR or adjacent pairing token contains device identity metadata only. Direct bundle transport authenticates the short-lived local session with that token, while encryption still uses the separately shared passphrase. Never put a sync passphrase in a QR code, pairing payload, or ordinary message.
