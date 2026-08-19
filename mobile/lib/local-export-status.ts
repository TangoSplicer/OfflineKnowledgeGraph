import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCAL_EXPORT_STATUS_KEY = "offline-knowledge-graph.local-export-status.v1";
export const EXPORT_REMINDER_EDIT_THRESHOLD = 5;

export type LocalExportStatus = {
  lastExportedAt: string | null;
  editsSinceLastExport: number;
  remindersEnabled: boolean;
};

export const emptyLocalExportStatus = (): LocalExportStatus => ({
  lastExportedAt: null,
  editsSinceLastExport: 0,
  remindersEnabled: true,
});

export function normalizeLocalExportStatus(value: unknown): LocalExportStatus {
  if (!value || typeof value !== "object") return emptyLocalExportStatus();
  const candidate = value as Partial<LocalExportStatus>;
  return {
    lastExportedAt: typeof candidate.lastExportedAt === "string" && !Number.isNaN(Date.parse(candidate.lastExportedAt)) ? candidate.lastExportedAt : null,
    editsSinceLastExport: typeof candidate.editsSinceLastExport === "number" && Number.isFinite(candidate.editsSinceLastExport) ? Math.max(0, Math.floor(candidate.editsSinceLastExport)) : 0,
    remindersEnabled: candidate.remindersEnabled !== false,
  };
}

export function recordLocalExport(status: LocalExportStatus, exportedAt = new Date()): LocalExportStatus {
  return { ...status, lastExportedAt: exportedAt.toISOString(), editsSinceLastExport: 0 };
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

export async function persistLocalExport(): Promise<LocalExportStatus> {
  return saveLocalExportStatus(recordLocalExport(await loadLocalExportStatus()));
}

export async function persistLocalGraphEdit(): Promise<LocalExportStatus> {
  return saveLocalExportStatus(recordLocalGraphEdit(await loadLocalExportStatus()));
}
