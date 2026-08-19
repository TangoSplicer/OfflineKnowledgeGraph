# Validation and Performance Profile

This document describes repeatable engineering checks for Offline Knowledge Graph. The quality gates are designed around the local-first model: tests use deterministic local fixtures, and native interaction flows do not require accounts or remote graph services.

## Pull-request verification

The repository workflow at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on pull requests, protected-branch pushes, and manually dispatched workflow runs.

| Gate | Scope | Expected evidence |
|---|---|---|
| Rust and FFI validation | Rust core and Common Lisp bridge | Release build and tests complete before mobile delivery checks. |
| Lint and Expo configuration | Mobile source and resolved Expo config | Source quality warnings are visible and configuration resolves successfully. |
| TypeScript and Vitest | Mobile domain logic, encryption, restore, progress, and workflows | `pnpm check` and the deterministic Vitest suite pass. |
| Android release APK | Expo prebuild plus Gradle | A release APK with bundled JavaScript and supported ABIs is attached as an artifact. |
| Maestro Android flows | Installed release APK in an API 29 emulator | JUnit report and captured interaction evidence are retained as CI artifacts. |

Protected export coverage verifies the complete ZIP package, authenticated passphrase encryption, wrong-passphrase rejection, ciphertext-tamper rejection, valid graph recovery, passphrase-strength feedback, and sensitive-action classification for protected sharing and restore.

## Reproducing mobile checks

Run the following from the `mobile` directory:

```bash
pnpm install --frozen-lockfile
pnpm lint
npx expo config --type public
pnpm check
pnpm test -- --run
```

Native interaction validation requires an Android emulator or device plus an installed build. Run `maestro test .maestro` from the mobile directory after installation. The workflow automates the Android sequence on an Ubuntu hosted runner using an API 29 x86_64 emulator.

## Large-graph regression benchmarks

[`tests/performance-benchmarks.test.ts`](../tests/performance-benchmarks.test.ts) uses deterministic record shapes with tags, summaries, notes, evidence-confidence values, and directed relationships. It validates real encryption, layout, and filtering paths rather than mock timings.

| Scenario | Fixture | Regression limit |
|---|---:|---:|
| Complete encryption | 100 concepts and 600 relationships | Under 3,000 ms |
| Complete encryption | 500 concepts and 3,000 relationships | Under 5,000 ms |
| Complete encryption | 1,000 concepts and 6,000 relationships | Under 8,000 ms |
| Layout preparation | 1,000 concepts per supported layout | Under 150 ms per layout |
| Explore relationship filters | Three filters across 6,000 relationships | Under 500 ms total |

Run the performance profile in isolation with:

```bash
pnpm test -- --run tests/performance-benchmarks.test.ts
```

When changing encryption parameters, backup serialization, protected-export format, layout mathematics, or Explore filtering, retain the test’s correctness assertions and revise a limit only through intentional review.
