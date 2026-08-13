# Offline Knowledge Graph

Offline Knowledge Graph combines a portable Rust core with language bridges and a local-first Expo mobile client. The repository keeps each runtime in a dedicated root directory so changes can be developed and validated independently.

| Directory | Responsibility | How it is maintained |
| --- | --- | --- |
| `rust-core/` | Native Rust knowledge-graph library and C-compatible FFI exports. | Updated when core graph behavior or FFI contracts change. |
| `common-lisp-ffi/` | Common Lisp integration and FFI validation harness. | Updated when the Rust FFI interface changes. |
| `clojure-ffi/` | Clojure bridge sources. | Updated when Clojure interop is extended. |
| `mercury-ffi/` | Mercury bridge sources. | Updated when Mercury interop is extended. |
| `mobile/` | Canonical Expo/React Native client, including onboarding, local graph storage, tests, and Android configuration. | Updated for all mobile UI and local graph features. |
| `.github/workflows/ci.yml` | GitHub Actions pipeline. | Builds Rust, validates the Lisp bridge, and validates/builds the Android APK from `mobile/`. |

## Build paths

The mobile client is intentionally kept in **`mobile/`**. This is the only mobile directory that the CI/CD pipeline builds. The former duplicate `offline-knowledge-graph-mobile/` working directory has been consolidated into `mobile/`, so all future mobile changes should be made there before committing.

The Rust and FFI directories remain at the repository root and are not replaced by mobile updates. They continue to be tested by the same CI/CD run alongside the Android APK job.

## Local validation

```bash
cd mobile
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

The GitHub Actions workflow creates an Android debug APK from `mobile/android` and uploads it as the `offline-knowledge-graph-debug-apk` artifact.
