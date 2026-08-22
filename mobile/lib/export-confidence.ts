import type { LocalExportStatus } from "./local-export-status";

const DAY_MS = 24 * 60 * 60 * 1000;
export const RESTORE_TEST_INTERVAL_DAYS = 90;

export type LocalBackupHealth = {
  level: "missing" | "current" | "review" | "stale";
  title: string;
  detail: string;
  needsExport: boolean;
};

function validTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function summarizeLocalBackupHealth(status: LocalExportStatus, now = new Date()): LocalBackupHealth {
  const exportedAt = validTime(status.lastExportedAt);
  if (exportedAt === null) return { level: "missing", title: "Create a local copy", detail: "No verified local export is recorded yet. Save a ZIP before relying on this graph.", needsExport: true };
  const ageDays = Math.max(0, Math.floor((now.getTime() - exportedAt) / DAY_MS));
  if (ageDays <= 14) return { level: "current", title: "Local copy looks current", detail: ageDays === 0 ? "A verified export was recorded today." : `A verified export was recorded ${ageDays} days ago.`, needsExport: false };
  if (ageDays <= 30) return { level: "review", title: "Review your local copy", detail: `Your latest verified export is ${ageDays} days old. Export again after important graph changes.`, needsExport: false };
  return { level: "stale", title: "Refresh your local copy", detail: `Your latest verified export is ${ageDays} days old. Create a fresh ZIP to keep recovery current.`, needsExport: true };
}

export function shouldShowRestoreTestReminder(status: LocalExportStatus, now = new Date()): boolean {
  if (!status.restoreTestRemindersEnabled || !validTime(status.lastExportedAt)) return false;
  const restoreTestedAt = validTime(status.lastRestoreTestedAt);
  if (restoreTestedAt === null) return true;
  const exportedAt = validTime(status.lastExportedAt) ?? 0;
  if (restoreTestedAt < exportedAt) return true;
  return now.getTime() - restoreTestedAt >= RESTORE_TEST_INTERVAL_DAYS * DAY_MS;
}

export function restoreTestStatusLabel(status: LocalExportStatus, now = new Date()): string {
  if (!status.lastExportedAt) return "Create a verified export before scheduling a restore test.";
  if (shouldShowRestoreTestReminder(status, now)) return "A restore test is due for this local copy.";
  return "Your latest local copy has a recorded restore test.";
}
