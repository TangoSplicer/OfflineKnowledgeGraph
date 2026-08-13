import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  addConnection,
  connections as seededConnections,
  getConnectionsForConcept,
  isRelationshipType,
  relationshipTypes,
  removeConnection,
  sanitizeRelationshipNote,
  updateConnection,
  type Connection,
  type NewConnectionInput,
  type RelationshipType,
} from "@/lib/knowledge-data";

const STORAGE_KEY = "offline-knowledge-graph.relationships.v1";

type NewRelationship = NewConnectionInput;
type RelationshipChanges = Partial<Pick<Connection, "relationship" | "strength" | "note">>;

type RelationshipStoreValue = {
  connections: Connection[];
  isReady: boolean;
  relationshipsFor: (conceptId: string) => ReturnType<typeof getConnectionsForConcept>;
  addRelationship: (relationship: NewRelationship) => void;
  updateRelationship: (connectionId: string, changes: RelationshipChanges) => void;
  removeRelationship: (connectionId: string) => void;
  replaceRelationships: (nextConnections: Connection[]) => void;
};

const RelationshipContext = createContext<RelationshipStoreValue | null>(null);

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

export function RelationshipProvider({ children }: PropsWithChildren) {
  const [connections, setConnections] = useState<Connection[]>(seededConnections);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored || !active) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(isSavedConnection)) {
          setConnections(parsed.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note) })));
        }
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(connections)).catch(() => undefined);
  }, [connections, isReady]);

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
    setConnections(nextConnections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note) })));
  }, []);
  const relationshipsFor = useCallback((conceptId: string) => getConnectionsForConcept(connections, conceptId), [connections]);

  const value = useMemo(
    () => ({ connections, isReady, relationshipsFor, addRelationship, updateRelationship, removeRelationship, replaceRelationships }),
    [connections, isReady, relationshipsFor, addRelationship, updateRelationship, removeRelationship, replaceRelationships],
  );

  return <RelationshipContext.Provider value={value}>{children}</RelationshipContext.Provider>;
}

export function useRelationshipStore() {
  const context = useContext(RelationshipContext);
  if (!context) throw new Error("useRelationshipStore must be used within RelationshipProvider");
  return context;
}

export { relationshipTypes, type RelationshipType };
