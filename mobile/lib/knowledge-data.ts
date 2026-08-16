export type ConceptKind = "Theory" | "Method" | "Evidence" | "Question" | "Person";
export const conceptKinds = ["Theory", "Method", "Evidence", "Question", "Person"] as const;
export const isConceptKind = (value: string): value is ConceptKind => conceptKinds.includes(value as ConceptKind);

export type Concept = {
  id: string;
  title: string;
  kind: ConceptKind;
  summary: string;
  note: string;
  updatedAt: string;
  backlinks: number;
  color: string;
  tags: string[];
  sourceUrls: string[];
  sourceAnnotation?: string;
  sourceQuote?: string;
  archivedAt?: number;
};

export const relationshipTypes = ["supports", "challenges", "explains", "depends on", "exemplifies"] as const;
export type RelationshipType = (typeof relationshipTypes)[number];

export type Connection = {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  strength: number;
  note: string;
  sourceUrls: string[];
  sourceAnnotation?: string;
  sourceQuote?: string;
  evidenceConfidence?: number;
};

export type NewConnectionInput = Omit<Connection, "id" | "note" | "sourceUrls"> & { note?: string; sourceUrls?: string[] };
export type NewConceptInput = { title: string; kind: ConceptKind; note: string; tags?: string[]; sourceUrls?: string[]; sourceAnnotation?: string; sourceQuote?: string };
export type ConceptChanges = Partial<Pick<Concept, "title" | "kind" | "summary" | "note" | "tags" | "sourceUrls" | "sourceAnnotation" | "sourceQuote">>;

export type RelationshipView = {
  connection: Connection;
  otherConcept: Concept;
  isOutgoing: boolean;
};

export type GraphCollection = {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  updatedAt: string;
  color: string;
};

export const concepts: Concept[] = [
  {
    id: "adaptive-systems",
    title: "Adaptive Systems",
    kind: "Theory",
    summary: "Systems that respond to feedback, reconfigure, and retain useful structure over time.",
    note: "The central idea in this graph. Use it to connect learning, constraints, and institutional change.",
    updatedAt: "Edited 12 min ago",
    backlinks: 14,
    color: "#7C6CFF",
    tags: ["systems", "learning"],
    sourceUrls: ["https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/"],
    sourceAnnotation: "Use this essay to distinguish a useful systems intervention from a merely visible change.",
    sourceQuote: "Leverage points are places within a complex system where a small shift in one thing can produce big changes in everything.",
  },
  {
    id: "feedback-loops",
    title: "Feedback Loops",
    kind: "Method",
    summary: "Reinforcing and balancing cycles that explain how a pattern gains momentum or stabilizes.",
    note: "Look for delays, unintended effects, and measurable signals before assigning an intervention.",
    updatedAt: "Edited yesterday",
    backlinks: 9,
    color: "#48D6E8",
    tags: ["systems", "method"],
    sourceUrls: [],
  },
  {
    id: "cognitive-load",
    title: "Cognitive Load",
    kind: "Evidence",
    summary: "A model for the amount of working memory required to understand or perform a task.",
    note: "Useful for testing whether an interface or process is learnable under realistic constraints.",
    updatedAt: "Edited 2 days ago",
    backlinks: 7,
    color: "#63D2A3",
    tags: ["research", "learning"],
    sourceUrls: [],
  },
  {
    id: "boundary-conditions",
    title: "Boundary Conditions",
    kind: "Question",
    summary: "The conditions under which an explanation holds, fails, or requires a different model.",
    note: "Name the setting, scale, and constraints before generalizing a connection.",
    updatedAt: "Edited 3 days ago",
    backlinks: 5,
    color: "#FFB86B",
    tags: ["research", "questions"],
    sourceUrls: [],
  },
  {
    id: "donella-meadows",
    title: "Donella Meadows",
    kind: "Person",
    summary: "Systems thinker known for leverage points and practical approaches to complex change.",
    note: "A useful source path for connecting stocks, flows, delays, and intervention points.",
    updatedAt: "Edited last week",
    backlinks: 4,
    color: "#F48FB1",
    tags: ["systems", "people"],
    sourceUrls: ["https://donellameadows.org/"],
    sourceAnnotation: "Primary reference hub for Meadows' systems practice writing.",
  },
];

export const connections: Connection[] = [
  { id: "adaptive-feedback", sourceId: "adaptive-systems", targetId: "feedback-loops", relationship: "depends on", strength: 5, note: "Feedback signals help the system decide what to retain, adjust, or stop.", sourceUrls: [], evidenceConfidence: 4 },
  { id: "adaptive-boundaries", sourceId: "adaptive-systems", targetId: "boundary-conditions", relationship: "explains", strength: 4, note: "An adaptive response is meaningful only within a clearly named context.", sourceUrls: [] },
  { id: "feedback-cognitive", sourceId: "feedback-loops", targetId: "cognitive-load", relationship: "challenges", strength: 3, note: "Fast feedback can overload attention when the signals are noisy or competing.", sourceUrls: [] },
  { id: "meadows-adaptive", sourceId: "donella-meadows", targetId: "adaptive-systems", relationship: "supports", strength: 4, note: "Meadows offers practical language for seeing intervention points in adaptive systems.", sourceUrls: ["https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/"], sourceAnnotation: "Direct supporting source from Meadows' leverage-points framing.", sourceQuote: "The least obvious part of the system, its function or purpose, is often the most crucial determinant of the system's behavior.", evidenceConfidence: 5 },
];

export const graphCollections: GraphCollection[] = [
  {
    id: "systems-practice",
    name: "Systems Practice",
    description: "Models, interventions, and case studies for complex adaptive work.",
    nodeCount: 128,
    updatedAt: "Active today",
    color: "#7C6CFF",
  },
  {
    id: "learning-architecture",
    name: "Learning Architecture",
    description: "Notes on sensemaking, learning design, and cognitive ergonomics.",
    nodeCount: 76,
    updatedAt: "Updated yesterday",
    color: "#48D6E8",
  },
  {
    id: "field-research",
    name: "Field Research",
    description: "Interview patterns, observations, and evidence trails.",
    nodeCount: 43,
    updatedAt: "Updated 6 days ago",
    color: "#63D2A3",
  },
];

export const reviewCues = [
  { label: "Reconnect an orphaned idea", detail: "3 concepts have only one link", tint: "#FFB86B" },
  { label: "Return to a leverage point", detail: "Adaptive Systems has 4 unreviewed notes", tint: "#48D6E8" },
];

export const activity = [
  { id: "activity-1", title: "Linked Feedback Loops", detail: "to Adaptive Systems", time: "12 min", color: "#48D6E8" },
  { id: "activity-2", title: "Expanded Cognitive Load", detail: "with a new evidence note", time: "Yesterday", color: "#63D2A3" },
  { id: "activity-3", title: "Reviewed Boundary Conditions", detail: "in Systems Practice", time: "Mon", color: "#FFB86B" },
];

export const findConcept = (id: string) => concepts.find((concept) => concept.id === id) ?? concepts[0];

export const relatedTo = (id: string) => concepts.filter((concept) => concept.id !== id).slice(0, 3);

export const connectionIncludesConcept = (connection: Connection, conceptId: string) =>
  connection.sourceId === conceptId || connection.targetId === conceptId;

export const sameConceptPair = (connection: Pick<Connection, "sourceId" | "targetId">, sourceId: string, targetId: string) =>
  (connection.sourceId === sourceId && connection.targetId === targetId) ||
  (connection.sourceId === targetId && connection.targetId === sourceId);

export const isRelationshipType = (value: string): value is RelationshipType =>
  relationshipTypes.includes(value as RelationshipType);

export const clampRelationshipStrength = (strength: number) => Math.max(1, Math.min(5, Math.round(strength)));
export const sanitizeRelationshipNote = (note: string | undefined) => (note ?? "").trim().slice(0, 2_000);
export const normalizeSourceUrls = (values: string[] | undefined) => [...new Set((values ?? []).flatMap((value) => value.split(/[\n,]+/)).map((value) => value.trim()).filter((value) => { try { const parsed = new URL(value); return parsed.protocol === "https:" || parsed.protocol === "http:"; } catch { return false; } }))].slice(0, 12);
export const sanitizeSourceAnnotation = (value: string | undefined) => (value ?? "").trim().slice(0, 900);
export const sanitizeSourceQuote = (value: string | undefined) => (value ?? "").trim().slice(0, 1_200);
export const clampEvidenceConfidence = (value: number | undefined) => Math.max(1, Math.min(5, Math.round(value ?? 3)));

const conceptColors = ["#7C6CFF", "#48D6E8", "#63D2A3", "#FFB86B", "#F48FB1"];
const slugifyConceptTitle = (title: string) => title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "concept";

export function createConceptRecord(input: NewConceptInput, existing: Concept[], now = Date.now()): Concept {
  const title = input.title.trim().slice(0, 100);
  const note = input.note.trim().slice(0, 2_000);
  const baseId = slugifyConceptTitle(title);
  const id = existing.some((concept) => concept.id === baseId) ? `${baseId}-${now.toString(36)}` : baseId;
  const tags = [...new Set((input.tags ?? []).flatMap((tag) => tag.split(",")).map((tag) => tag.trim().replace(/^#/, "").replace(/\s+/g, " ").toLowerCase().slice(0, 32)).filter(Boolean))].slice(0, 10);
  return { id, title, kind: input.kind, summary: note || `A new ${input.kind.toLowerCase()} to explore.`, note, updatedAt: "Just now", backlinks: 0, color: conceptColors[existing.length % conceptColors.length], tags, sourceUrls: normalizeSourceUrls(input.sourceUrls), sourceAnnotation: sanitizeSourceAnnotation(input.sourceAnnotation), sourceQuote: sanitizeSourceQuote(input.sourceQuote) };
}

export function updateConceptRecord(existing: Concept[], conceptId: string, changes: ConceptChanges): Concept[] {
  return existing.map((concept) => {
    if (concept.id !== conceptId) return concept;
    const title = changes.title === undefined ? concept.title : changes.title.trim().slice(0, 100);
    const summary = changes.summary === undefined ? concept.summary : changes.summary.trim().slice(0, 500);
    const note = changes.note === undefined ? concept.note : changes.note.trim().slice(0, 2_000);
    return {
      ...concept,
      title: title || concept.title,
      kind: changes.kind && isConceptKind(changes.kind) ? changes.kind : concept.kind,
      summary: summary || note || concept.summary,
      note,
      updatedAt: "Just now",
      tags: changes.tags === undefined ? concept.tags ?? [] : [...new Set(changes.tags.flatMap((tag) => tag.split(",")).map((tag) => tag.trim().replace(/^#/, "").replace(/\s+/g, " ").toLowerCase().slice(0, 32)).filter(Boolean))].slice(0, 10),
      sourceUrls: changes.sourceUrls === undefined ? concept.sourceUrls ?? [] : normalizeSourceUrls(changes.sourceUrls),
      sourceAnnotation: changes.sourceAnnotation === undefined ? concept.sourceAnnotation ?? "" : sanitizeSourceAnnotation(changes.sourceAnnotation),
      sourceQuote: changes.sourceQuote === undefined ? concept.sourceQuote ?? "" : sanitizeSourceQuote(changes.sourceQuote),
    };
  });
}

export function addConnection(existing: Connection[], input: NewConnectionInput): Connection[] {
  if (
    input.sourceId === input.targetId ||
    !isRelationshipType(input.relationship) ||
    existing.some((connection) => sameConceptPair(connection, input.sourceId, input.targetId))
  ) {
    return existing;
  }

  return [
    ...existing,
    {
      ...input,
      id: `${input.sourceId}-${input.targetId}`,
      strength: clampRelationshipStrength(input.strength),
      note: sanitizeRelationshipNote(input.note),
      sourceUrls: normalizeSourceUrls(input.sourceUrls),
      sourceAnnotation: sanitizeSourceAnnotation(input.sourceAnnotation),
      sourceQuote: sanitizeSourceQuote(input.sourceQuote),
      evidenceConfidence: clampEvidenceConfidence(input.evidenceConfidence),
    },
  ];
}

export function updateConnection(
  existing: Connection[],
  connectionId: string,
  changes: Partial<Pick<Connection, "relationship" | "strength" | "note" | "sourceUrls" | "sourceAnnotation" | "sourceQuote" | "evidenceConfidence">>,
): Connection[] {
  return existing.map((connection) => {
    if (connection.id !== connectionId) return connection;
    return {
      ...connection,
      relationship: changes.relationship && isRelationshipType(changes.relationship) ? changes.relationship : connection.relationship,
      strength: changes.strength === undefined ? connection.strength : clampRelationshipStrength(changes.strength),
      note: changes.note === undefined ? connection.note : sanitizeRelationshipNote(changes.note),
      sourceUrls: changes.sourceUrls === undefined ? connection.sourceUrls ?? [] : normalizeSourceUrls(changes.sourceUrls),
      sourceAnnotation: changes.sourceAnnotation === undefined ? connection.sourceAnnotation ?? "" : sanitizeSourceAnnotation(changes.sourceAnnotation),
      sourceQuote: changes.sourceQuote === undefined ? connection.sourceQuote ?? "" : sanitizeSourceQuote(changes.sourceQuote),
      evidenceConfidence: changes.evidenceConfidence === undefined ? clampEvidenceConfidence(connection.evidenceConfidence) : clampEvidenceConfidence(changes.evidenceConfidence),
    };
  });
}

export const removeConnection = (existing: Connection[], connectionId: string) =>
  existing.filter((connection) => connection.id !== connectionId);

export function getConnectionsForConcept(existing: Connection[], conceptId: string, availableConcepts: Concept[] = concepts): RelationshipView[] {
  return existing.flatMap((connection) => {
    if (!connectionIncludesConcept(connection, conceptId)) return [];
    const isOutgoing = connection.sourceId === conceptId;
    const otherId = isOutgoing ? connection.targetId : connection.sourceId;
    const otherConcept = availableConcepts.find((concept) => concept.id === otherId);
    return otherConcept ? [{ connection, otherConcept, isOutgoing }] : [];
  });
}
