import { describe, expect, it } from "vitest";

import { appendGraphActivity, createGraphActivity, formatActivityTime } from "../lib/activity-history";

describe("local graph activity history", () => {
  it("prepends events chronologically and respects its storage bound", () => {
    const earlier = createGraphActivity("concept-created", "Created a concept", "Theory", 1_000);
    const later = createGraphActivity("relationship-created", "Linked concepts", "supports", 2_000);
    const history = appendGraphActivity([earlier], later, 1);
    expect(history).toEqual([later]);
  });

  it("formats clear, bounded relative times", () => {
    expect(formatActivityTime(1_000, 1_000)).toBe("now");
    expect(formatActivityTime(1_000, 31 * 60_000)).toBe("30m");
    expect(formatActivityTime(1_000, 3 * 60 * 60_000)).toBe("2h");
  });
});
