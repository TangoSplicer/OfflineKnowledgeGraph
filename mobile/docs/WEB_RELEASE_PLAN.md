# Web Release Plan

## Purpose

The web release will be a browser-first expression of **Offline Knowledge Graph**, not a separate product. It will retain the existing local workspace, export, restore, search, graph exploration, and offline-oriented boundaries. No account, mandatory server, shared database, or hidden cloud synchronization will be introduced.

## Browser Experience

| Area | Desktop behavior | Small-screen behavior |
| --- | --- | --- |
| Navigation | A persistent left navigation rail gives Home, Explore, and Library equal visual weight and keeps the active workspace apparent. | The existing compact bottom tab bar remains in place for touch ergonomics. |
| Workspace width | Content expands to a readable working column, with enough room for graph controls and export guidance without resembling a stretched phone view. | Existing single-column layouts remain the default. |
| Explore canvas | Keyboard instructions remain visible; wide screens prioritize the canvas and retain the existing pan, zoom, label, filter, and edge-detail interactions. | Native gestures and concise controls remain unchanged. |
| Export and recovery | Browser exports download directly to the user’s chosen location; destination checks remain explicitly self-confirmed local reminders. | Native sharing behavior remains unchanged. |

## Visual Direction

The browser workspace uses the established **deep ink, violet, and cyan** knowledge-map palette. The desktop shell should feel like a focused research desk: a quiet left rail, a broad but bounded work surface, clear section labels, and responsive spacing. It should not imitate a marketing page or introduce unrelated account-based collaboration.

## Accessibility and Local-First Boundaries

Keyboard navigation, visible focus feedback, readable contrast, and existing accessible labels remain required. Browser-specific keyboard controls for the graph remain supported. The web version continues to store graph state on the user’s device/browser context; clearing browser storage or changing browser profiles can remove local data, so exports remain the portable recovery method.

## Open-Access Delivery

The app will continue to produce a static browser bundle. A public deployment should be user-controlled: publish the verified project through the workspace’s publishing control or host the exported static bundle through a chosen static host. The production host must serve the generated files over HTTPS and route unknown application paths to the app entry point where client routing is used. Deployment does not turn a local graph into shared or server-backed data.
