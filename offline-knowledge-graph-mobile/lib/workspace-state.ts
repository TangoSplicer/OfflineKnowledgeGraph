import { concepts as seededConcepts, connections as seededConnections, type Concept, type Connection } from "./knowledge-data";

export type WorkspaceSnapshot = { concepts: Concept[]; connections: Connection[] };

export const createEmptyWorkspace = (): WorkspaceSnapshot => ({ concepts: [], connections: [] });

export const createDemoWorkspace = (): WorkspaceSnapshot => ({
  concepts: seededConcepts.map((concept) => ({ ...concept })),
  connections: seededConnections.map((connection) => ({ ...connection })),
});

export const isEmptyWorkspace = (workspace: WorkspaceSnapshot) => workspace.concepts.length === 0 && workspace.connections.length === 0;

export const isSeededDemoWorkspace = (workspace: WorkspaceSnapshot) =>
  workspace.concepts.length === seededConcepts.length &&
  workspace.connections.length === seededConnections.length &&
  workspace.concepts.every((concept) => seededConcepts.some((seeded) => seeded.id === concept.id)) &&
  workspace.connections.every((connection) => seededConnections.some((seeded) => seeded.id === connection.id));

export const isSeededDemoConnections = (nextConnections: Connection[]) =>
  nextConnections.length === seededConnections.length && nextConnections.every((connection) => seededConnections.some((seeded) => seeded.id === connection.id));
