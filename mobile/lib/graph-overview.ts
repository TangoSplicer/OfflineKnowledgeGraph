import type { Concept, Connection } from "./knowledge-data";

export type GraphViewId = "overview" | "strong-links" | "noted-links";
export type GraphView = { id: GraphViewId; name: string; description: string; color: string; scope: "all" | "strong" | "noted"; glyph: string };

export const graphViews: GraphView[] = [
  { id: "overview", name: "Complete graph", description: "Read the full map of concepts, bridges, and open areas in this workspace.", color: "#7C6CFF", scope: "all", glyph: "◇" },
  { id: "strong-links", name: "Strong connections", description: "Focus on the relationships carrying the most weight in your current graph.", color: "#48D6E8", scope: "strong", glyph: "↗" },
  { id: "noted-links", name: "Relationship notebook", description: "Review the links that already have written context and supporting notes.", color: "#63D2A3", scope: "noted", glyph: "≡" },
];

export type ScopedGraph = { concepts: Concept[]; connections: Connection[] };
export type GraphNarrative = { headline: string; summary: string; structure: string; relationshipStory: string; actions: string[]; featuredConnections: Connection[] };

export function getGraphView(id: string | undefined): GraphView { return graphViews.find((view) => view.id === id) ?? graphViews[0]; }

export function scopeGraph(concepts: Concept[], connections: Connection[], scope: GraphView["scope"]): ScopedGraph {
  const scopedConnections = scope === "strong" ? connections.filter((connection) => connection.strength >= 4) : scope === "noted" ? connections.filter((connection) => Boolean(connection.note)) : connections;
  if (scope === "all") return { concepts, connections: scopedConnections };
  const involved = new Set(scopedConnections.flatMap((connection) => [connection.sourceId, connection.targetId]));
  return { concepts: concepts.filter((concept) => involved.has(concept.id)), connections: scopedConnections };
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export function buildGraphNarrative(concepts: Concept[], connections: Connection[]): GraphNarrative {
  if (!concepts.length) return { headline: "Your graph is ready for its first idea.", summary: "There are no local concepts yet. Start with one observation, question, or working note, then connect it when a useful relationship becomes clear.", structure: "No concepts or relationship paths have been recorded.", relationshipStory: "Once you add two ideas, their connection will appear here with its type, strength, and written explanation.", actions: ["Create one concept from a working note.", "Add a second concept that challenges, supports, or explains it.", "Write a brief note for the relationship."], featuredConnections: [] };

  const degree = new Map(concepts.map((concept) => [concept.id, 0]));
  connections.forEach((connection) => { degree.set(connection.sourceId, (degree.get(connection.sourceId) ?? 0) + 1); degree.set(connection.targetId, (degree.get(connection.targetId) ?? 0) + 1); });
  const isolated = concepts.filter((concept) => (degree.get(concept.id) ?? 0) === 0);
  const kindCounts = concepts.reduce<Record<string, number>>((counts, concept) => ({ ...counts, [concept.kind]: (counts[concept.kind] ?? 0) + 1 }), {});
  const kinds = Object.entries(kindCounts).sort((left, right) => right[1] - left[1]).map(([kind, count]) => `${count} ${kind.toLowerCase()}${count === 1 ? "" : "s"}`).join(", ");
  const typeCounts = connections.reduce<Record<string, number>>((counts, connection) => ({ ...counts, [connection.relationship]: (counts[connection.relationship] ?? 0) + 1 }), {});
  const relationships = Object.entries(typeCounts).sort((left, right) => right[1] - left[1]).map(([type, count]) => `${count} ${type}`).join(", ");
  const featuredConnections = [...connections].sort((left, right) => (right.strength + Number(Boolean(right.note)) * 0.25) - (left.strength + Number(Boolean(left.note)) * 0.25)).slice(0, 3);
  const featured = featuredConnections[0];
  const source = featured ? concepts.find((concept) => concept.id === featured.sourceId) : undefined;
  const target = featured ? concepts.find((concept) => concept.id === featured.targetId) : undefined;
  const actions: string[] = [];
  if (!connections.length) actions.push("Connect two concepts with a clear relationship type.");
  if (isolated.length) actions.push(`Reconnect ${plural(isolated.length, "unlinked concept")} so they can be rediscovered through the map.`);
  if (connections.some((connection) => !connection.note)) actions.push("Add a written explanation to one relationship without a note.");
  if (connections.some((connection) => connection.strength <= 2)) actions.push("Review a weaker connection: strengthen it with evidence or remove it if it no longer helps.");
  if (!actions.length) actions.push("Open a concept and expand its working note with an example, source, or question.");
  return {
    headline: `${plural(concepts.length, "idea")} connected by ${plural(connections.length, "relationship")}.`,
    summary: featured && source && target ? `The map currently centers on a strong ${featured.relationship} path from ${source.title} to ${target.title}. Use this overview to follow that bridge, inspect its note, and decide where the next useful connection belongs.` : `This workspace contains ${plural(concepts.length, "local concept")}. Add a relationship when one idea gives useful context to another.`,
    structure: `${kinds || "No concept kinds yet"}. ${connections.length ? `Relationship patterns: ${relationships}.` : "No relationships have been recorded yet."}${isolated.length ? ` ${plural(isolated.length, "concept")} currently stand alone.` : " Every concept is reachable through at least one local link."}`,
    relationshipStory: connections.length ? `The graph is a set of explicit claims: a link says one concept ${featured?.relationship ?? "relates to"} another, while its strength indicates how central that claim feels right now. Read the notes on the most prominent links before adding more structure.` : "Relationships turn a list of ideas into a navigable map. Start with one relationship you can explain in a sentence.",
    actions,
    featuredConnections,
  };
}
