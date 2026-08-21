import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCAL_EXPORT_STATUS_KEY = "offline-knowledge-graph.local-export-status.v1";
export const EXPORT_REMINDER_EDIT_THRESHOLD = 5;
export const LOCAL_EXPORT_HISTORY_LIMIT = 12;
export const LOCAL_EXPORT_HISTORY_RETENTION_OPTIONS = [3, 6, 12] as const;
export const LOCAL_EXPORT_HISTORY_SORT_OPTIONS = ["recent", "concept-count", "relationship-count"] as const;

export type LocalExportFormat = "complete-zip" | "protected-zip";
export type LocalExportHistoryFilter = "all" | LocalExportFormat;
export type LocalExportHistoryRetention = (typeof LOCAL_EXPORT_HISTORY_RETENTION_OPTIONS)[number];
export type LocalExportHistorySort = (typeof LOCAL_EXPORT_HISTORY_SORT_OPTIONS)[number];
export type LocalExportRecord = {
  format: LocalExportFormat;
  filename: string;
  conceptCount: number;
  connectionCount: number;
};
export type LocalExportHistoryEntry = LocalExportRecord & {
  id: string;
  exportedAt: string;
  verified: true;
};

export type LocalExportStatus = {
  lastExportedAt: string | null;
  editsSinceLastExport: number;
  remindersEnabled: boolean;
  historyRetention: LocalExportHistoryRetention;
  history: LocalExportHistoryEntry[];
};

export const emptyLocalExportStatus = (): LocalExportStatus => ({
  lastExportedAt: null,
  editsSinceLastExport: 0,
  remindersEnabled: true,
  historyRetention: LOCAL_EXPORT_HISTORY_LIMIT,
  history: [],
});

export function normalizeLocalExportHistoryRetention(value: unknown): LocalExportHistoryRetention {
  return typeof value === "number" && LOCAL_EXPORT_HISTORY_RETENTION_OPTIONS.includes(value as LocalExportHistoryRetention) ? value as LocalExportHistoryRetention : LOCAL_EXPORT_HISTORY_LIMIT;
}

function normalizeLocalExportHistory(value: unknown, limit = LOCAL_EXPORT_HISTORY_LIMIT): LocalExportHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<LocalExportHistoryEntry>;
    if (typeof candidate.exportedAt !== "string" || Number.isNaN(Date.parse(candidate.exportedAt))) return [];
    if (candidate.format !== "complete-zip" && candidate.format !== "protected-zip") return [];
    if (typeof candidate.filename !== "string" || !candidate.filename.trim()) return [];
    const conceptCount = typeof candidate.conceptCount === "number" && Number.isFinite(candidate.conceptCount) ? Math.max(0, Math.floor(candidate.conceptCount)) : 0;
    const connectionCount = typeof candidate.connectionCount === "number" && Number.isFinite(candidate.connectionCount) ? Math.max(0, Math.floor(candidate.connectionCount)) : 0;
    return [{ id: typeof candidate.id === "string" && candidate.id ? candidate.id : `${candidate.exportedAt}-${index}`, exportedAt: candidate.exportedAt, format: candidate.format, filename: candidate.filename.trim(), conceptCount, connectionCount, verified: true as const }];
  }).sort((left, right) => right.exportedAt.localeCompare(left.exportedAt)).slice(0, limit);
}

export function normalizeLocalExportStatus(value: unknown): LocalExportStatus {
  if (!value || typeof value !== "object") return emptyLocalExportStatus();
  const candidate = value as Partial<LocalExportStatus>;
  const historyRetention = normalizeLocalExportHistoryRetention(candidate.historyRetention);
  return {
    lastExportedAt: typeof candidate.lastExportedAt === "string" && !Number.isNaN(Date.parse(candidate.lastExportedAt)) ? candidate.lastExportedAt : null,
    editsSinceLastExport: typeof candidate.editsSinceLastExport === "number" && Number.isFinite(candidate.editsSinceLastExport) ? Math.max(0, Math.floor(candidate.editsSinceLastExport)) : 0,
    remindersEnabled: candidate.remindersEnabled !== false,
    historyRetention,
    history: normalizeLocalExportHistory(candidate.history, historyRetention),
  };
}

export function recordLocalExport(status: LocalExportStatus, exportedAt = new Date(), record: LocalExportRecord = { format: "complete-zip", filename: "offline-knowledge-graph-export.zip", conceptCount: 0, connectionCount: 0 }): LocalExportStatus {
  const exportedAtValue = exportedAt.toISOString();
  const entry: LocalExportHistoryEntry = { id: `${exportedAtValue}-${record.filename}`, exportedAt: exportedAtValue, format: record.format, filename: record.filename, conceptCount: Math.max(0, Math.floor(record.conceptCount)), connectionCount: Math.max(0, Math.floor(record.connectionCount)), verified: true };
  return { ...status, lastExportedAt: exportedAtValue, editsSinceLastExport: 0, history: [entry, ...status.history.filter((item) => item.id !== entry.id)].slice(0, status.historyRetention) };
}

export function setLocalExportHistoryRetention(status: LocalExportStatus, value: unknown): LocalExportStatus {
  const historyRetention = normalizeLocalExportHistoryRetention(value);
  return { ...status, historyRetention, history: status.history.slice(0, historyRetention) };
}

export function clearLocalExportHistory(status: LocalExportStatus): LocalExportStatus {
  return { ...status, lastExportedAt: null, history: [] };
}

export function filterLocalExportHistory(history: LocalExportHistoryEntry[], query = "", format: LocalExportHistoryFilter = "all"): LocalExportHistoryEntry[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return history.filter((entry) => {
    const matchesFormat = format === "all" || entry.format === format;
    const searchable = `${entry.filename} ${entry.format} ${entry.conceptCount} ${entry.connectionCount} ${entry.exportedAt}`.toLocaleLowerCase();
    return matchesFormat && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function sortLocalExportHistory(history: LocalExportHistoryEntry[], sort: LocalExportHistorySort = "recent"): LocalExportHistoryEntry[] {
  return [...history].sort((left, right) => {
    const primary = sort === "concept-count" ? right.conceptCount - left.conceptCount : sort === "relationship-count" ? right.connectionCount - left.connectionCount : right.exportedAt.localeCompare(left.exportedAt);
    return primary || right.exportedAt.localeCompare(left.exportedAt) || left.id.localeCompare(right.id);
  });
}

export function recordLocalGraphEdit(status: LocalExportStatus): LocalExportStatus {
  return { ...status, editsSinceLastExport: status.editsSinceLastExport + 1 };
}

export function shouldShowLocalExportReminder(status: LocalExportStatus): boolean {
  return status.remindersEnabled && status.editsSinceLastExport >= EXPORT_REMINDER_EDIT_THRESHOLD;
}

export function localExportStatusLabel(status: LocalExportStatus, now = new Date()): string {
  if (!status.lastExportedAt) return "No local export yet";
  const exported = status.lastExportedAt.slice(0, 10);
  const current = now.toISOString().slice(0, 10);
  return exported === current ? "Last export today" : `Last export ${exported}`;
}

export async function loadLocalExportStatus(): Promise<LocalExportStatus> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_EXPORT_STATUS_KEY);
    return raw ? normalizeLocalExportStatus(JSON.parse(raw)) : emptyLocalExportStatus();
  } catch {
    return emptyLocalExportStatus();
  }
}

export async function saveLocalExportStatus(status: LocalExportStatus): Promise<LocalExportStatus> {
  const normalized = normalizeLocalExportStatus(status);
  await AsyncStorage.setItem(LOCAL_EXPORT_STATUS_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function persistLocalExport(record?: LocalExportRecord): Promise<LocalExportStatus> {
  return saveLocalExportStatus(recordLocalExport(await loadLocalExportStatus(), new Date(), record));
}

export async function persistLocalGraphEdit(): Promise<LocalExportStatus> {
  return saveLocalExportStatus(recordLocalGraphEdit(await loadLocalExportStatus()));
}
