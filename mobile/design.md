# Offline Knowledge Graph — Mobile Interface Design

## Product intent

**Offline Knowledge Graph** is a private, local-first workspace for collecting concepts, seeing the relationships between them, and moving from a single note to connected evidence. The initial interface focuses on a calm, high-density research experience that remains legible and usable in portrait orientation on a 9:16 phone. It does not require an account or network connection for core use.

## Screen list and primary content

| Screen | Primary content | Main functions |
| --- | --- | --- |
| **Today** | A concise overview of the active graph, a relationship map preview, recent concepts, and review cues. | Open a concept, continue graph exploration, search the local graph, and start a new concept. |
| **Explore** | An interactive relationship canvas with a focused concept at the center and nearby nodes arranged by semantic proximity. | Pan visually through connections, select a nearby node, filter by connection type, and open concept details. |
| **Concept Detail** | Title, type, evidence summary, backlinks, related concepts, and an editable note area. | Read, edit, add a relationship, and jump to another concept. |
| **Library** | Locally stored graph collections with item counts, last-edited metadata, and progress context. | Switch collections, open a graph, and create a new local collection. |
| **Search Sheet** | Search field, recent searches, ranked concept results, and suggested connection paths. | Find concepts quickly and navigate directly to a detail or graph focus. |
| **Settings** | Offline-storage status, appearance preference, and app information. | Review local-first storage status and adjust presentation preferences. |

## Key user flows

| User goal | Flow |
| --- | --- |
| **Understand a topic** | Today → tap the central relationship map → Explore → select a neighboring node → Concept Detail → inspect supporting links. |
| **Find a concept fast** | Tap the search affordance → Search Sheet → type a phrase → tap a result → Concept Detail. |
| **Capture a new idea** | Today → tap the persistent create button → Concept Detail editor → save locally → view the newly linked concept in Explore. |
| **Switch research context** | Library → choose a local graph collection → Today updates to the selected graph. |

## Portrait layout and one-handed usage

The primary navigation remains at the bottom, within natural thumb reach. High-frequency actions use bottom-aligned controls or a floating circular create control above the tab bar. Screens preserve a generous 20–24 px horizontal margin, 44 px minimum touch targets, a clear large-title hierarchy, and native sheets for focused actions such as search and filtering. The interface avoids dense toolbar clusters and keeps destructive actions out of the primary exploration path.

## Color and visual language

The interface uses a confident **midnight research** palette rather than a generic productivity theme. The dark canvas is **Ink #0B1020**, raised surfaces are **Slate #151C2E**, and the main active color is **Signal Violet #7C6CFF**. **Electric Cyan #48D6E8** denotes graph links and informational emphasis; **Mint #63D2A3** signals healthy local storage or completed review. Warm **Amber #FFB86B** is reserved for review cues. Body text is **Cloud #F3F6FC**, while secondary labels are **Mist #9CA9C4**. In light mode, the same violet and cyan retain their semantic roles against **Paper #F7F8FC**.

## Data vocabulary

| Model | Core fields | Purpose |
| --- | --- | --- |
| **Graph** | `id`, `name`, `description`, `updatedAt`, `nodeCount` | A locally available knowledge collection. |
| **Concept** | `id`, `title`, `kind`, `summary`, `note`, `updatedAt`, `tags` | A unit of knowledge shown in lists, detail pages, and the graph canvas. |
| **Connection** | `id`, `sourceId`, `targetId`, `relationship`, `strength` | A typed relationship between two concepts. |
| **Review cue** | `id`, `conceptId`, `label`, `dueLabel` | A lightweight prompt that helps users return to important knowledge. |

## Initial quality bar

The first version should feel like a native research tool rather than a generic dashboard. It will use polished cards, typographic contrast, subtle depth, restrained haptics, deterministic sample graph content, and working navigation. The product should remain useful without accounts, cloud sync, or external APIs.
