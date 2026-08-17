# Validation and Performance Profile

This document describes the repeatable engineering checks for Offline Knowledge Graph. The quality gates are designed around the project’s local-first model: tests use deterministic local fixtures, while native interaction flows never need an account or a remote graph service.

## Pull-request verification

The repository workflow at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on pull requests, protected-branch pushes, and manually dispatched workflow runs. The Android interaction job consumes the debug APK produced by the build job, so the flow suite exercises the artifact that CI actually built.

| Gate | Scope | Expected evidence |
|---|---|---|
| Rust and FFI validation | Rust core and Common Lisp bridge | Release build and tests complete before mobile delivery checks. |
| Lint and Expo configuration | Mobile source and resolved Expo config | Source quality warnings are visible and configuration resolves successfully. |
| TypeScript and Vitest | Mobile domain logic, encryption, progress model, and workflows | `pnpm check` and the full deterministic Vitest suite pass. |
| Android release APK | Expo prebuild plus Gradle | A release APK with bundled JavaScript and `armeabi-v7a`, `arm64-v8a`, and `x86_64` ABIs is attached as an artifact. |
| Maestro Android flows | Installed release APK in an API 29 emulator | JUnit report and any captured interaction evidence are retained as CI artifacts. |

The Maestro flows in [`mobile/.maestro`](../.maestro) clear local application state before every scenario. They cover the first-concept wizard, optional demo-graph navigation into Explore and its filters, and Library access from an empty workspace. See [`.maestro/README.md`](../.maestro/README.md) for local execution guidance.

## Reproducing mobile checks

Run the following from the `mobile` directory when validating source changes locally. The first command resolves project configuration without exposing application secrets.

```bash
pnpm install --frozen-lockfile
pnpm lint
npx expo config --type public
pnpm check
pnpm test -- --run
```

Native flow validation requires an Android emulator or device plus an installed debug build. After installation, run `maestro test .maestro` from the mobile directory. The workflow automates this sequence on an Ubuntu hosted runner using an x86_64 Android emulator, avoiding dependence on constrained macOS runner capacity.

The CI job installs the official Maestro CLI at pinned version `1.39.0` through the documented `MAESTRO_VERSION` installer interface, with retry handling for transient download errors. The job verifies the installed version before it starts an API 29 `x86_64` emulator on the Ubuntu runner. This removes the prior dependency on a third-party setup action and keeps the flow runner version reviewable.

## Large-graph regression benchmarks

[`tests/performance-benchmarks.test.ts`](../tests/performance-benchmarks.test.ts) uses deterministic but representative record shapes with tags, summaries, notes, evidence-confidence values, and six directed relationships per concept. The suite validates the real `encryptCompleteGraph`, `graphPositionFor`, and `filterExploreConnections` code paths rather than using mock implementation timing.

| Scenario | Fixture | Regression limit | Observed development-run result |
|---|---:|---:|---:|
| Complete encryption | 100 concepts and 600 relationships | Under 3,000 ms | 171.1 ms |
| Complete encryption | 500 concepts and 3,000 relationships | Under 5,000 ms | 241.6 ms |
| Complete encryption | 1,000 concepts and 6,000 relationships | Under 8,000 ms | 384.3 ms |
| Layout preparation | 1,000 concepts per supported layout | Under 150 ms per layout | 0.2–0.9 ms |
| Explore relationship filters | Three filters across 6,000 relationships | Under 500 ms total | 1.2 ms |

> The observed measurements were captured in the managed development sandbox on 2026-08-16. They are regression indicators, not mobile-device service-level objectives. CI enforces the broader deterministic limits so normal runner variance does not cause flaky tests.

Run the profile in isolation with:

```bash
pnpm test -- --run tests/performance-benchmarks.test.ts
```

The suite emits concise timing lines for each encryption size, supported layout, and dense-filter pass. When changing encryption parameters, backup serialization, layout mathematics, or Explore filtering, keep the test’s correctness assertions and revise only an intentionally reviewed limit.
