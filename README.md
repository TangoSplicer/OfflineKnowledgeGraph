# Offline Knowledge Graph

Offline Knowledge Graph combines a portable Rust core with language bridges and a local-first Expo mobile client. The mobile app is designed for personal knowledge work without mandatory accounts: concepts, relationships, search, graph exploration, local backup, and recovery remain under the device owner’s control.

| Directory | Responsibility | How it is maintained |
|---|---|---|
| `rust-core/` | Native Rust knowledge-graph library and C-compatible FFI exports. | Updated when core graph behavior or FFI contracts change. |
| `common-lisp-ffi/` | Common Lisp integration and FFI validation harness. | Updated when the Rust FFI interface changes. |
| `clojure-ffi/` | Clojure bridge sources. | Updated when Clojure interop is extended. |
| `mercury-ffi/` | Mercury bridge sources. | Updated when Mercury interop is extended. |
| `mobile/` | Canonical Expo/React Native client, onboarding, local graph storage, protected export, recovery, tests, and Android configuration. | Updated for all mobile product and documentation changes. |
| `.github/workflows/ci.yml` | GitHub Actions pipeline. | Validates the Rust core, FFI bridge, mobile source, and Android APK workflow. |

## Local-first protection

The mobile client’s Home dashboard creates a complete ZIP export containing graph JSON and an SVG graph image. Users can turn on passphrase protection to create an authenticated encrypted archive before sharing. The app never stores the passphrase; native devices request biometric or device-passcode confirmation before protected export sharing and restore. An optional **non-secret recovery hint** can travel with a protected archive, but it is rejected if it matches the passphrase. Protected archives are decrypted and validated locally through **Library → Restore protected export** before they can replace a graph.

The app also retains a short, device-local **export history** containing only archive metadata: creation time, filename, protection type, and graph counts. It does not retain an export copy, a passphrase, or sharing destinations. Explore includes **All labels**, **Balanced**, and **Minimal** display modes so larger local graphs remain readable without hiding node interaction.

Read the canonical mobile documentation for the complete workflows:

| Guide | Covers |
|---|---|
| [Mobile overview](mobile/README.md) | Product principles, local-first workspaces, and protected export format. |
| [Detailed user guide](mobile/docs/USER_GUIDE.md) | Complete daily workflow: capture, relationships, Explore, navigation, exports, recovery, and exchange. |
| [Local protection and recovery](mobile/docs/LOCAL_PROTECTION_AND_RECOVERY.md) | Passphrase, recovery hints, encryption, biometric confirmation, recovery, and nearby transfer boundaries. |
| [Audience and use cases](mobile/docs/AUDIENCE_AND_USE_CASES.md) | Intended users, field applications, fit criteria, and product boundaries. |
| [Validation and performance](mobile/docs/VALIDATION_AND_PERFORMANCE.md) | Local commands, bounded CI gates, protected-export tests, and benchmarks. |
| [Changelog](CHANGELOG.md) | Published product, protection, navigation, CI, and documentation history. |
| [Owner task list](USER_TASKS.md) | Practical setup, backup, recovery, maintenance, and release checklist. |

## Build paths

The mobile client is intentionally kept in **`mobile/`**. This is the only mobile directory that CI/CD builds. The Rust and FFI directories remain at the repository root and continue to be validated alongside the Android workflow.

## Local validation

```bash
cd mobile
pnpm install --frozen-lockfile
pnpm lint
npx expo config --type public
pnpm check
pnpm test -- --run
```

The GitHub Actions workflow assembles the Android **release** artifact from `mobile/`, retains the corresponding interaction-test evidence, and bounds Common Lisp dependency installation so a stalled hosted package mirror cannot block the pipeline indefinitely.
