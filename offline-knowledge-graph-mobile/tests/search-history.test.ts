import { describe, expect, it } from "vitest";

import { addSearchToHistory, removeSearchFromHistory } from "../lib/search-history";

describe("persistent Explore search history", () => {
  it("deduplicates recent searches case-insensitively and keeps newest first", () => {
    expect(addSearchToHistory(["feedback loops", "adaptive"], "Feedback Loops")).toEqual(["Feedback Loops", "adaptive"]);
  });

  it("ignores very short entries and caps history length", () => {
    expect(addSearchToHistory(["one", "two"], "a")).toEqual(["one", "two"]);
    expect(addSearchToHistory(["one", "two", "three"], "four", 3)).toEqual(["four", "one", "two"]);
  });

  it("removes a selected recent query", () => {
    expect(removeSearchFromHistory(["feedback", "adaptive"], "feedback")).toEqual(["adaptive"]);
  });
});
