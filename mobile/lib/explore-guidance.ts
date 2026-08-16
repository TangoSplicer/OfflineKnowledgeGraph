export const EXPLORE_GUIDANCE_KEY = "offline-knowledge-graph.explore-guidance.v1";

export const shouldShowExploreGuidance = (storedValue: string | null) =>
  storedValue !== "dismissed";
