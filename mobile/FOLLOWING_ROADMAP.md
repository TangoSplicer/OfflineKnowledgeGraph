# Offline Knowledge Graph — Following Roadmap for Discussion

## Product Direction

The completed work now supports a complete local research loop: capture material, turn it into concepts, connect and support those concepts, review weak evidence, explore paths, maintain the graph, and exchange selected knowledge. The following stage should focus on making the graph **more insightful during use** while preserving offline ownership and understandable controls.

| Priority | Initiative | Practical outcome | Core experience |
|---|---|---|---|
| 1 | Local connection suggestions | Surface plausible missing links without automatically changing the graph. | A review queue proposes pairs using shared tags, source overlap, and graph proximity. |
| 2 | Focus mode and multi-hop exploration | Make dense graphs easier to read during research. | Pin a concept, choose one-to-three hops, and temporarily hide unrelated ideas. |
| 3 | Research question workspace | Keep active questions connected to supporting and opposing evidence. | A question view groups claims, sources, counterpoints, and open gaps. |
| 4 | Change log and reversible edits | Improve confidence when reorganizing a complex local graph. | A local recent-changes log supports review and targeted undo for key graph edits. |
| 5 | Portable research brief | Turn a selected subgraph into a polished shareable summary. | A readable brief combines concepts, evidence, quotations, and unresolved questions. |

## Recommended First Delivery

The recommended first delivery is **Local Connection Suggestions**. The app already has tags, relationship strength, source URLs, annotations, quotations, evidence confidence, clusters, and path analysis. A transparent suggestion queue can use these existing local signals without inventing facts or silently creating links.

The next recommended delivery is **Focus Mode and Multi-Hop Exploration**. It directly improves the day-to-day usability of the Explore canvas once the graph contains more ideas and relationships.

## Decision Points for Discussion

| Question | Option A | Option B |
|---|---|---|
| What should lead the next stage? | Better local reasoning through connection suggestions | Better reading experience through focus mode |
| How should suggestions behave? | Always require user confirmation | Allow one-tap acceptance with an undo history |
| What should the portable brief optimize for? | Research sharing with citations and quotations | Personal review with prompts and action items |
