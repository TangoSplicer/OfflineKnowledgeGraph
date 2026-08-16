import type { GraphActivity } from "./activity-history";

export type ArchiveTimelineEntry = GraphActivity & { actionLabel: "Archived" | "Restored" };

export function archiveTimeline(activity: GraphActivity[]): ArchiveTimelineEntry[] {
  return activity.filter((entry) => entry.type === "concept-archived" || entry.type === "concept-restored").map((entry) => ({ ...entry, actionLabel: entry.type === "concept-archived" ? ("Archived" as const) : ("Restored" as const) })).sort((left, right) => right.createdAt - left.createdAt);
}
