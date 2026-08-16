import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { normalizeSourceUrls } from "./source-references";

export type CaptureDraft = { id: string; title: string; body: string; sourceUrls: string[]; tags: string[]; createdAt: number; updatedAt: number };
export type CaptureDraftInput = Pick<CaptureDraft, "title" | "body"> & Partial<Pick<CaptureDraft, "sourceUrls" | "tags">>;
export const captureTemplates = [{ id: "quick-note", label: "Quick note", title: "", body: "" }, { id: "quotation", label: "Quotation", title: "Source idea", body: "\"\"\n\nWhy this matters:" }, { id: "source", label: "Source link", title: "Source to explore", body: "Question or insight:" }] as const;
const STORAGE_KEY = "offline-knowledge-graph.capture-inbox.v1";
const normalizeTags = (tags: string[] | undefined) => [...new Set((tags ?? []).flatMap((tag) => tag.split(",")).map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0, 10);

export function createCaptureDraft(input: CaptureDraftInput, now = Date.now()): CaptureDraft { return { id: `capture-${now.toString(36)}-${input.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "note"}`, title: input.title.trim().slice(0, 100), body: input.body.trim().slice(0, 4_000), sourceUrls: normalizeSourceUrls(input.sourceUrls), tags: normalizeTags(input.tags), createdAt: now, updatedAt: now }; }
export const isCaptureDraft = (value: unknown): value is CaptureDraft => Boolean(value) && typeof value === "object" && typeof (value as CaptureDraft).id === "string" && typeof (value as CaptureDraft).title === "string" && typeof (value as CaptureDraft).body === "string" && Array.isArray((value as CaptureDraft).sourceUrls) && Array.isArray((value as CaptureDraft).tags) && typeof (value as CaptureDraft).createdAt === "number" && typeof (value as CaptureDraft).updatedAt === "number";

type CaptureInboxValue = { drafts: CaptureDraft[]; isReady: boolean; addDraft: (input: CaptureDraftInput) => CaptureDraft; updateDraft: (id: string, input: Partial<CaptureDraftInput>) => void; removeDraft: (id: string) => void; applyTags: (ids: string[], tags: string[]) => void };
const CaptureInboxContext = createContext<CaptureInboxValue | null>(null);
export function CaptureInboxProvider({ children }: PropsWithChildren) {
  const [drafts, setDrafts] = useState<CaptureDraft[]>([]); const [isReady, setIsReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((stored) => { if (!stored) return; try { const parsed: unknown = JSON.parse(stored); if (Array.isArray(parsed)) setDrafts(parsed.filter(isCaptureDraft).sort((a, b) => b.updatedAt - a.updatedAt)); } catch { setDrafts([]); } }).catch(() => undefined).finally(() => setIsReady(true)); }, []);
  useEffect(() => { if (isReady) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); }, [drafts, isReady]);
  const addDraft = useCallback((input: CaptureDraftInput) => { const draft = createCaptureDraft(input); setDrafts((current) => [draft, ...current]); return draft; }, []);
  const updateDraft = useCallback((id: string, input: Partial<CaptureDraftInput>) => setDrafts((current) => current.map((draft) => draft.id !== id ? draft : { ...draft, title: input.title === undefined ? draft.title : input.title.trim().slice(0, 100), body: input.body === undefined ? draft.body : input.body.trim().slice(0, 4_000), sourceUrls: input.sourceUrls === undefined ? draft.sourceUrls : normalizeSourceUrls(input.sourceUrls), tags: input.tags === undefined ? draft.tags : normalizeTags(input.tags), updatedAt: Date.now() })), []);
  const removeDraft = useCallback((id: string) => setDrafts((current) => current.filter((draft) => draft.id !== id)), []);
  const applyTags = useCallback((ids: string[], tags: string[]) => setDrafts((current) => current.map((draft) => ids.includes(draft.id) ? { ...draft, tags: normalizeTags([...draft.tags, ...tags]), updatedAt: Date.now() } : draft)), []);
  const value = useMemo(() => ({ drafts, isReady, addDraft, updateDraft, removeDraft, applyTags }), [drafts, isReady, addDraft, updateDraft, removeDraft, applyTags]);
  return <CaptureInboxContext.Provider value={value}>{children}</CaptureInboxContext.Provider>;
}
export function useCaptureInbox() { const context = useContext(CaptureInboxContext); if (!context) throw new Error("useCaptureInbox must be used within CaptureInboxProvider"); return context; }
