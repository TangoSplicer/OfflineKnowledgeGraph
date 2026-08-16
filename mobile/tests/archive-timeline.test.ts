import { describe, expect, it } from "vitest";

import { archiveTimeline } from "../lib/archive-timeline";
import { createGraphActivity } from "../lib/activity-history";

describe("archive activity timeline", () => {
  it("keeps only archive and restoration events in newest-first order", () => {
    const entries = archiveTimeline([
      createGraphActivity("concept-created", "Created A", "", 10),
      createGraphActivity("concept-archived", "Archived A", "Kept", 30),
      createGraphActivity("concept-restored", "Restored A", "Returned", 40),
    ]);
    expect(entries.map((entry) => entry.actionLabel)).toEqual(["Restored", "Archived"]);
  });
});
