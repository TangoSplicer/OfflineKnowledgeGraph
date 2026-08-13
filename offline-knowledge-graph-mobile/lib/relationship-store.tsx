import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  addConnection,
  getConnectionsForConcept,
  isConceptKind,
  isRelationshipType,
  relationshipTypes,
  removeConnection,
  sanitizeRelationshipNote,
  updateConnection,
  type Concept,
  type Connection,
  type NewConceptInput,
  type NewConnectionInput,
  type RelationshipType,
  createConceptRecord,
} from "@/lib/knowledge-data";
import { createDemoWorkspace, isSeededDemoConnections, isSeededDemoWorkspace } from "@/lib/workspace-state";

const STORAGE_KEY = "offline-knowledge-graph.graph.v2";
const LEGACY_RELATIONSHIP_KEY = "offline-knowledge-graph.relationships.v1";

type NewRelationship = NewConnectionInput;
type RelationshipChanges = Partial<Pick<Connection, "relationship" | "strength" | "note">>;

type RelationshipStoreValue = {
  concepts: Concept[];
  connections: Connection[];
  isReady: boolean;
  relationshipsFor: (conceptId: string) => ReturnType<typeof getConnectionsForConcept>;
  addConcept: (input: NewConceptInput) => Concept;
  addRelationship: (relationship: NewRelationship) => void;
  updateRelationship: (connectionId: string, changes: RelationshipChanges) => void;
  removeRelationship: (connectionId: string) => void;
  replaceRelationships: (nextConnections: Connection[]) => void;
  replaceGraph: (nextConcepts: Concept[], nextConnections: Connection[]) => void;
  loadDemoGraph: () => void;
  clearWorkspace: () => void;
};

type StoredGraph = { concepts: Concept[]; connections: Connection[] };
const RelationshipContext = createContext<RelationshipStoreValue | null>(null);

function isSavedConcept(value: unknown): value is Concept {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Concept>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.kind === "string" &&
    isConceptKind(candidate.kind) &&
    typeof candidate.summary === "string" &&
    typeof candidate.note === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.backlinks === "number" &&
    typeof candidate.color === "string"
  );
}

function isSavedConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Connection>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.sourceId === "string" &&
    typeof candidate.targetId === "string" &&
    typeof candidate.relationship === "string" &&
    isRelationshipType(candidate.relationship) &&
    typeof candidate.strength === "number"
  );
}

function normalizeConnections(nextConnections: Connection[]) {
  return nextConnections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note) }));
}

function isStoredGraph(value: unknown): value is StoredGraph {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredGraph>;
  return Array.isArray(candidate.concepts) && candidate.concepts.every(isSavedConcept) && Array.isArray(candidate.connections) && candidate.connections.every(isSavedConnection);
}

export function RelationshipProvider({ children }: PropsWithChildren) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (stored) => {
        if (!active) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isStoredGraph(parsed)) {
            if (isSeededDemoWorkspace(parsed)) {
              setConcepts([]);
              setConnections([]);
            } else {
              setConcepts(parsed.concepts);
              setConnections(normalizeConnections(parsed.connections));
            }
            return;
          }
        }
        const legacyStored = await AsyncStorage.getItem(LEGACY_RELATIONSHIP_KEY);
        if (!legacyStored || !active) return;
        const legacyParsed: unknown = JSON.parse(legacyStored);
        if (Array.isArray(legacyParsed) && legacyParsed.every(isSavedConnection) && !isSeededDemoConnections(legacyParsed)) setConnections(normalizeConnections(legacyParsed));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ concepts, connections: normalizeConnections(connections) })).catch(() => undefined);
  }, [concepts, connections, isReady]);

  const addConcept = useCallback((input: NewConceptInput) => {
    const concept = createConceptRecord(input, concepts);
    setConcepts((current) => [...current, concept]);
    return concept;
  }, [concepts]);
  const addRelationship = useCallback((relationship: NewRelationship) => {
    setConnections((current) => addConnection(current, relationship));
  }, []);
  const updateRelationship = useCallback((connectionId: string, changes: RelationshipChanges) => {
    setConnections((current) => updateConnection(current, connectionId, changes));
  }, []);
  const removeRelationship = useCallback((connectionId: string) => {
    setConnections((current) => removeConnection(current, connectionId));
  }, []);
  const replaceRelationships = useCallback((nextConnections: Connection[]) => {
    setConnections(normalizeConnections(nextConnections));
  }, []);
  const replaceGraph = useCallback((nextConcepts: Concept[], nextConnections: Connection[]) => {
    setConcepts(nextConcepts);
    setConnections(normalizeConnections(nextConnections));
  }, []);
  const loadDemoGraph = useCallback(() => {
    const demo = createDemoWorkspace();
    setConcepts(demo.concepts);
    setConnections(normalizeConnections(demo.connections));
  }, []);
  const clearWorkspace = useCallback(() => {
    setConcepts([]);
    setConnections([]);
  }, []);
  const relationshipsFor = useCallback((conceptId: string) => getConnectionsForConcept(connections, conceptId, concepts), [connections, concepts]);

  const value = useMemo(
    () => ({ concepts, connections, isReady, relationshipsFor, addConcept, addRelationship, updateRelationship, removeRelationship, replaceRelationships, replaceGraph, loadDemoGraph, clearWorkspace }),
    [concepts, connections, isReady, relationshipsFor, addConcept, addRelationship, updateRelationship, removeRelationship, replaceRelationships, replaceGraph, loadDemoGraph, clearWorkspace],
  );

  return <RelationshipContext.Provider value={value}>{children}</RelationshipContext.Provider>;
}

export function useRelationshipStore() {
  const context = useContext(RelationshipContext);
  if (!context) throw new Error("useRelationshipStore must be used within RelationshipProvider");
  return context;
}

export { relationshipTypes, type RelationshipType };

export type { StoredGraph };
