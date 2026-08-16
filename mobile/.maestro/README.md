# Android Maestro interaction flows

This directory holds the deterministic native Android smoke flows used by the repository CI workflow. The flows are intentionally **local-first**: they clear app state, never depend on an account or network service, and exercise the production debug APK built in the preceding CI job.

| Flow | Coverage |
| --- | --- |
| `first-concept.yaml` | Empty workspace, three-step first-concept wizard, and local concept creation. |
| `explore-demo-graph.yaml` | Optional demo loading, Explore navigation, and a graph filter change. |
| `library-navigation.yaml` | Bottom-tab navigation and Library empty-state access. |

To run the suite locally against an already-installed Android build, install the [Maestro CLI](https://maestro.mobile.dev/) and run:

```bash
cd mobile
maestro test .maestro
```

The GitHub Actions workflow installs the debug APK into an Android API 29 emulator, executes the same command with JUnit output, and uploads the report and any screenshots as CI artifacts. Keep assertions tied to visible user-facing copy, and preserve `clearState: true` so every flow is independent.
