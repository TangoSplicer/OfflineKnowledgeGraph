export type GraphActivityType = "concept-created" | "concept-updated" | "concept-archived" | "concept-restored" | "relationship-created" | "relationship-updated" | "relationship-removed" | "graph-imported" | "demo-loaded";
export type GraphActivity = { id: string; type: GraphActivityType; title: string; detail: string; color: string; createdAt: number };

const colors: Record<GraphActivityType, string> = { "concept-created": "#63D2A3", "concept-updated": "#A9A0FF", "concept-archived": "#FFB86B", "concept-restored": "#63D2A3", "relationship-created": "#48D6E8", "relationship-updated": "#FFB86B", "relationship-removed": "#FF9EAE", "graph-imported": "#B8B0FF", "demo-loaded": "#48D6E8" };

export function createGraphActivity(type: GraphActivityType, title: string, detail: string, now = Date.now()): GraphActivity {
  const token = `${type}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return { id: `${now.toString(36)}-${token}`, type, title, detail, color: colors[type], createdAt: now };
}

export function appendGraphActivity(existing: GraphActivity[], next: GraphActivity, limit = 40): GraphActivity[] {
  return [next, ...existing.filter((entry) => entry.id !== next.id)].sort((left, right) => right.createdAt - left.createdAt).slice(0, limit);
}

export function isGraphActivity(value: unknown): value is GraphActivity {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<GraphActivity>;
  return typeof entry.id === "string" && typeof entry.type === "string" && typeof entry.title === "string" && typeof entry.detail === "string" && typeof entry.color === "string" && typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt);
}

export function formatActivityTime(createdAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
