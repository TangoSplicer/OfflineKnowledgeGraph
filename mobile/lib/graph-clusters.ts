import type { Concept, Connection } from "./knowledge-data";
import { allConceptTags, conceptHasTag } from "./concept-tags";

export type GraphCluster = { tag: string; concepts: Concept[]; internalConnections: Connection[]; bridgeConnections: Connection[] };

export function buildTagClusters(concepts: Concept[], connections: Connection[]): GraphCluster[] {
  return allConceptTags(concepts).map((tag) => {
    const members = concepts.filter((concept) => conceptHasTag(concept, tag));
    const memberIds = new Set(members.map((concept) => concept.id));
    const touching = connections.filter((connection) => memberIds.has(connection.sourceId) || memberIds.has(connection.targetId));
    return { tag, concepts: members, internalConnections: touching.filter((connection) => memberIds.has(connection.sourceId) && memberIds.has(connection.targetId)), bridgeConnections: touching.filter((connection) => memberIds.has(connection.sourceId) !== memberIds.has(connection.targetId)) };
  }).sort((left, right) => right.concepts.length - left.concepts.length || right.internalConnections.length - left.internalConnections.length || left.tag.localeCompare(right.tag));
}

export function clusterByTag(concepts: Concept[], connections: Connection[], tag: string): GraphCluster | undefined {
  return buildTagClusters(concepts, connections).find((cluster) => cluster.tag === tag.trim().toLowerCase());
}
