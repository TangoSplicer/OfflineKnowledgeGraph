import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  addConnection, createConceptRecord, getConnectionsForConcept, isConceptKind, isRelationshipType, normalizeSourceUrls, relationshipTypes, removeConnection, sameConceptPair, sanitizeRelationshipNote, sanitizeSourceAnnotation, sanitizeSourceQuote, clampEvidenceConfidence, updateConceptRecord, updateConnection,
  type Concept, type ConceptChanges, type Connection, type NewConceptInput, type NewConnectionInput, type RelationshipType,
} from "@/lib/knowledge-data";
import { appendGraphActivity, createGraphActivity, isGraphActivity, type GraphActivity } from "@/lib/activity-history";
import { normalizeConceptTags } from "@/lib/concept-tags";
import { activeGraphConnections, archiveConceptInState, restoreConceptInState, splitArchivedConcepts } from "@/lib/archive-state";
import { createDemoWorkspace, isSeededDemoConnections, isSeededDemoWorkspace } from "@/lib/workspace-state";

const STORAGE_KEY = "offline-knowledge-graph.graph.v2";
const LEGACY_RELATIONSHIP_KEY = "offline-knowledge-graph.relationships.v1";
const ACTIVITY_STORAGE_KEY = "offline-knowledge-graph.activity.v1";

type NewRelationship = NewConnectionInput;
type RelationshipChanges = Partial<Pick<Connection, "relationship" | "strength" | "note" | "sourceUrls" | "sourceAnnotation" | "sourceQuote" | "evidenceConfidence">>;
type StoredGraph = { concepts: Concept[]; connections: Connection[]; archivedConcepts?: Concept[] };

type RelationshipStoreValue = {
  concepts: Concept[];
  archivedConcepts: Concept[];
  allConcepts: Concept[];
  connections: Connection[];
  allConnections: Connection[];
  activity: GraphActivity[];
  isReady: boolean;
  relationshipsFor: (conceptId: string) => ReturnType<typeof getConnectionsForConcept>;
  addConcept: (input: NewConceptInput) => Concept;
  updateConcept: (conceptId: string, changes: ConceptChanges) => void;
  archiveConcept: (conceptId: string) => void;
  restoreConcept: (conceptId: string) => void;
  addRelationship: (relationship: NewRelationship) => void;
  updateRelationship: (connectionId: string, changes: RelationshipChanges) => void;
  removeRelationship: (connectionId: string) => void;
  replaceRelationships: (nextConnections: Connection[]) => void;
  replaceGraph: (nextConcepts: Concept[], nextConnections: Connection[]) => void;
  loadDemoGraph: () => void;
  clearWorkspace: () => void;
};

const RelationshipContext = createContext<RelationshipStoreValue | null>(null);

function isSavedConcept(value: unknown): value is Concept {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Concept>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.kind === "string" && isConceptKind(candidate.kind) && typeof candidate.summary === "string" && typeof candidate.note === "string" && typeof candidate.updatedAt === "string" && typeof candidate.backlinks === "number" && typeof candidate.color === "string" && (candidate.tags === undefined || (Array.isArray(candidate.tags) && candidate.tags.every((tag) => typeof tag === "string"))) && (candidate.sourceUrls === undefined || (Array.isArray(candidate.sourceUrls) && candidate.sourceUrls.every((url) => typeof url === "string"))) && (candidate.sourceAnnotation === undefined || typeof candidate.sourceAnnotation === "string") && (candidate.sourceQuote === undefined || typeof candidate.sourceQuote === "string") && (candidate.archivedAt === undefined || (typeof candidate.archivedAt === "number" && Number.isFinite(candidate.archivedAt)));
}

function isSavedConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Connection>;
  return typeof candidate.id === "string" && typeof candidate.sourceId === "string" && typeof candidate.targetId === "string" && typeof candidate.relationship === "string" && isRelationshipType(candidate.relationship) && typeof candidate.strength === "number" && (candidate.sourceUrls === undefined || (Array.isArray(candidate.sourceUrls) && candidate.sourceUrls.every((url) => typeof url === "string"))) && (candidate.sourceAnnotation === undefined || typeof candidate.sourceAnnotation === "string") && (candidate.sourceQuote === undefined || typeof candidate.sourceQuote === "string") && (candidate.evidenceConfidence === undefined || (typeof candidate.evidenceConfidence === "number" && Number.isFinite(candidate.evidenceConfidence)));
}

const normalizeConnections = (nextConnections: Connection[]) => nextConnections.map((connection) => ({ ...connection, note: sanitizeRelationshipNote(connection.note), sourceUrls: normalizeSourceUrls(connection.sourceUrls), sourceAnnotation: sanitizeSourceAnnotation(connection.sourceAnnotation), sourceQuote: sanitizeSourceQuote(connection.sourceQuote), evidenceConfidence: clampEvidenceConfidence(connection.evidenceConfidence) }));
const normalizeConcepts = (nextConcepts: Concept[]) => nextConcepts.map((concept) => ({ ...concept, tags: normalizeConceptTags(concept.tags), sourceUrls: normalizeSourceUrls(concept.sourceUrls), sourceAnnotation: sanitizeSourceAnnotation(concept.sourceAnnotation), sourceQuote: sanitizeSourceQuote(concept.sourceQuote) }));
const isStoredGraph = (value: unknown): value is StoredGraph => Boolean(value) && typeof value === "object" && Array.isArray((value as Partial<StoredGraph>).concepts) && (value as Partial<StoredGraph>).concepts?.every(isSavedConcept) === true && Array.isArray((value as Partial<StoredGraph>).connections) && (value as Partial<StoredGraph>).connections?.every(isSavedConnection) === true && ((value as Partial<StoredGraph>).archivedConcepts === undefined || ((value as Partial<StoredGraph>).archivedConcepts?.every(isSavedConcept) ?? false));

export function RelationshipProvider({ children }: PropsWithChildren) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [archivedConcepts, setArchivedConcepts] = useState<Concept[]>([]);
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [activity, setActivity] = useState<GraphActivity[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(ACTIVITY_STORAGE_KEY)]).then(async ([stored, storedActivity]) => {
      if (!active) return;
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isStoredGraph(parsed)) {
          if (isSeededDemoWorkspace(parsed)) { setConcepts([]); setArchivedConcepts([]); setAllConnections([]); } else {
            const split = splitArchivedConcepts(normalizeConcepts(parsed.concepts), normalizeConcepts(parsed.archivedConcepts ?? []));
            setConcepts(split.active); setArchivedConcepts(split.archived); setAllConnections(normalizeConnections(parsed.connections));
          }
        } else {
          const legacyStored = await AsyncStorage.getItem(LEGACY_RELATIONSHIP_KEY);
          if (legacyStored && active) {
            const legacyParsed: unknown = JSON.parse(legacyStored);
            if (Array.isArray(legacyParsed) && legacyParsed.every(isSavedConnection) && !isSeededDemoConnections(legacyParsed)) setAllConnections(normalizeConnections(legacyParsed));
          }
        }
      }
      if (storedActivity) {
        try { const parsedActivity: unknown = JSON.parse(storedActivity); if (Array.isArray(parsedActivity)) setActivity(parsedActivity.filter(isGraphActivity).sort((left, right) => right.createdAt - left.createdAt).slice(0, 40)); } catch { setActivity([]); }
      }
    }).catch(() => undefined).finally(() => { if (active) setIsReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (isReady) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ concepts: normalizeConcepts(concepts), archivedConcepts: normalizeConcepts(archivedConcepts), connections: normalizeConnections(allConnections) })).catch(() => undefined); }, [concepts, archivedConcepts, allConnections, isReady]);
  useEffect(() => { if (isReady) AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity)).catch(() => undefined); }, [activity, isReady]);

  const recordActivity = useCallback((type: GraphActivity["type"], title: string, detail: string) => { setActivity((current) => appendGraphActivity(current, createGraphActivity(type, title, detail))); }, []);
  const connections = useMemo(() => activeGraphConnections(concepts, allConnections), [concepts, allConnections]);
  const allConcepts = useMemo(() => [...concepts, ...archivedConcepts], [concepts, archivedConcepts]);
  const addConcept = useCallback((input: NewConceptInput) => {
    const concept = createConceptRecord(input, allConcepts);
    setConcepts((current) => [...current, concept]);
    recordActivity("concept-created", `Created ${concept.title}`, `New ${concept.kind.toLowerCase()} concept${concept.tags.length ? ` · #${concept.tags.join(" #")}` : ""}`);
    return concept;
  }, [allConcepts, recordActivity]);
  const updateConcept = useCallback((conceptId: string, changes: ConceptChanges) => {
    const current = concepts.find((concept) => concept.id === conceptId);
    setConcepts((currentConcepts) => updateConceptRecord(currentConcepts, conceptId, changes));
    if (current) recordActivity("concept-updated", `Updated ${changes.title?.trim() || current.title}`, "Refined concept details, tags, sources, or working note.");
  }, [concepts, recordActivity]);
  const archiveConcept = useCallback((conceptId: string) => {
    const current = concepts.find((concept) => concept.id === conceptId);
    if (!current) return;
    const next = archiveConceptInState(concepts, archivedConcepts, conceptId);
    setConcepts(next.active); setArchivedConcepts(next.archived);
    recordActivity("concept-archived", `Archived ${current.title}`, "Its relationship history is preserved and can be restored at any time.");
  }, [concepts, archivedConcepts, recordActivity]);
  const restoreConcept = useCallback((conceptId: string) => {
    const current = archivedConcepts.find((concept) => concept.id === conceptId);
    if (!current) return;
    const next = restoreConceptInState(concepts, archivedConcepts, conceptId);
    setConcepts(next.active); setArchivedConcepts(next.archived);
    recordActivity("concept-restored", `Restored ${current.title}`, "The concept and its preserved relationships are visible in the active graph again.");
  }, [archivedConcepts, recordActivity]);
  const addRelationship = useCallback((relationship: NewRelationship) => {
    const source = concepts.find((concept) => concept.id === relationship.sourceId); const target = concepts.find((concept) => concept.id === relationship.targetId);
    const exists = allConnections.some((connection) => sameConceptPair(connection, relationship.sourceId, relationship.targetId));
    setAllConnections((current) => addConnection(current, relationship));
    if (source && target && !exists && relationship.sourceId !== relationship.targetId && isRelationshipType(relationship.relationship)) recordActivity("relationship-created", `Linked ${source.title}`, `${relationship.relationship} ${target.title}`);
  }, [concepts, allConnections, recordActivity]);
  const updateRelationship = useCallback((connectionId: string, changes: RelationshipChanges) => {
    const current = allConnections.find((connection) => connection.id === connectionId);
    setAllConnections((currentConnections) => updateConnection(currentConnections, connectionId, changes));
    if (current) { const source = allConcepts.find((concept) => concept.id === current.sourceId)?.title ?? "Concept"; const target = allConcepts.find((concept) => concept.id === current.targetId)?.title ?? "concept"; recordActivity("relationship-updated", `Updated ${source} ↔ ${target}`, "Refined relationship type, strength, source, or written note."); }
  }, [allConnections, allConcepts, recordActivity]);
  const removeRelationship = useCallback((connectionId: string) => { const current = allConnections.find((connection) => connection.id === connectionId); setAllConnections((items) => removeConnection(items, connectionId)); if (current) recordActivity("relationship-removed", "Removed a relationship", "A local link was removed from the graph."); }, [allConnections, recordActivity]);
  const replaceRelationships = useCallback((nextConnections: Connection[]) => { setAllConnections(normalizeConnections(nextConnections)); }, []);
  const replaceGraph = useCallback((nextConcepts: Concept[], nextConnections: Connection[]) => { const split = splitArchivedConcepts(normalizeConcepts(nextConcepts)); setConcepts(split.active); setArchivedConcepts(split.archived); setAllConnections(normalizeConnections(nextConnections)); recordActivity("graph-imported", "Imported graph backup", `${nextConcepts.length} concepts and ${nextConnections.length} relationships are now available locally.`); }, [recordActivity]);
  const loadDemoGraph = useCallback(() => { const demo = createDemoWorkspace(); setConcepts(normalizeConcepts(demo.concepts)); setArchivedConcepts([]); setAllConnections(normalizeConnections(demo.connections)); recordActivity("demo-loaded", "Loaded demo graph", "Added a sample graph for exploration on this device."); }, [recordActivity]);
  const clearWorkspace = useCallback(() => { setConcepts([]); setArchivedConcepts([]); setAllConnections([]); setActivity([]); }, []);
  const relationshipsFor = useCallback((conceptId: string) => getConnectionsForConcept(connections, conceptId, concepts), [connections, concepts]);
  const value = useMemo(() => ({ concepts, archivedConcepts, allConcepts, connections, allConnections, activity, isReady, relationshipsFor, addConcept, updateConcept, archiveConcept, restoreConcept, addRelationship, updateRelationship, removeRelationship, replaceRelationships, replaceGraph, loadDemoGraph, clearWorkspace }), [concepts, archivedConcepts, allConcepts, connections, allConnections, activity, isReady, relationshipsFor, addConcept, updateConcept, archiveConcept, restoreConcept, addRelationship, updateRelationship, removeRelationship, replaceRelationships, replaceGraph, loadDemoGraph, clearWorkspace]);
  return <RelationshipContext.Provider value={value}>{children}</RelationshipContext.Provider>;
}

export function useRelationshipStore() { const context = useContext(RelationshipContext); if (!context) throw new Error("useRelationshipStore must be used within RelationshipProvider"); return context; }
export { relationshipTypes, type RelationshipType };
export type { StoredGraph };
