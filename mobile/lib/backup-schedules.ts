export const BACKUP_SCHEDULE_STORAGE_KEY = "offline-knowledge-graph.backup-schedules.v1";
export const BACKUP_SCHEDULE_MIN_BACKGROUND_INTERVAL_MINUTES = 15;

export type BackupScheduleFrequency = "daily" | "weekly";
export type BackupSchedule = {
  id: string;
  enabled: boolean;
  frequency: BackupScheduleFrequency;
  hourUTC: number;
  weekdayUTC: number;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt: string;
  lastError?: string;
};

export type NewBackupSchedule = Pick<BackupSchedule, "frequency" | "hourUTC" | "weekdayUTC"> & { id?: string; enabled?: boolean; now?: Date };

function ensureDate(value: Date): Date {
  if (Number.isNaN(value.getTime())) throw new Error("Backup schedules require a valid date.");
  return value;
}

export function validateBackupScheduleInput(input: Pick<BackupSchedule, "frequency" | "hourUTC" | "weekdayUTC">): void {
  if (input.frequency !== "daily" && input.frequency !== "weekly") throw new Error("Choose a daily or weekly backup schedule.");
  if (!Number.isInteger(input.hourUTC) || input.hourUTC < 0 || input.hourUTC > 23) throw new Error("Backup time must use an hour from 00:00 through 23:00 UTC.");
  if (!Number.isInteger(input.weekdayUTC) || input.weekdayUTC < 0 || input.weekdayUTC > 6) throw new Error("Weekly backup schedules require a weekday from Sunday through Saturday.");
}

function candidateForDay(date: Date, schedule: Pick<BackupSchedule, "frequency" | "hourUTC" | "weekdayUTC">): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), schedule.hourUTC, 0, 0, 0));
}

export function getNextBackupRunAt(schedule: Pick<BackupSchedule, "frequency" | "hourUTC" | "weekdayUTC">, after = new Date()): string {
  validateBackupScheduleInput(schedule);
  const start = ensureDate(new Date(after.getTime()));
  for (let offset = 0; offset <= 8; offset += 1) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + offset));
    if (schedule.frequency === "weekly" && day.getUTCDay() !== schedule.weekdayUTC) continue;
    const candidate = candidateForDay(day, schedule);
    if (candidate.getTime() > start.getTime()) return candidate.toISOString();
  }
  throw new Error("Unable to calculate the next backup run.");
}

export function createBackupSchedule(input: NewBackupSchedule): BackupSchedule {
  const now = ensureDate(input.now ?? new Date());
  validateBackupScheduleInput(input);
  const id = input.id?.trim() || `backup-${now.getTime()}`;
  const base = { frequency: input.frequency, hourUTC: input.hourUTC, weekdayUTC: input.weekdayUTC } as const;
  return { id, enabled: input.enabled ?? true, ...base, createdAt: now.toISOString(), updatedAt: now.toISOString(), nextRunAt: getNextBackupRunAt(base, now) };
}

export function isBackupScheduleDue(schedule: BackupSchedule, now = new Date()): boolean {
  return schedule.enabled && ensureDate(new Date(now.getTime())).getTime() >= ensureDate(new Date(schedule.nextRunAt)).getTime();
}

export function markBackupScheduleRun(schedule: BackupSchedule, now = new Date()): BackupSchedule {
  const current = ensureDate(new Date(now.getTime()));
  return { ...schedule, lastRunAt: current.toISOString(), lastError: undefined, updatedAt: current.toISOString(), nextRunAt: getNextBackupRunAt(schedule, current) };
}

export function markBackupScheduleFailure(schedule: BackupSchedule, error: string, now = new Date()): BackupSchedule {
  const current = ensureDate(new Date(now.getTime()));
  return { ...schedule, lastError: error.trim().slice(0, 240) || "Encrypted backup failed.", updatedAt: current.toISOString(), nextRunAt: getNextBackupRunAt(schedule, current) };
}

export function setBackupScheduleEnabled(schedule: BackupSchedule, enabled: boolean, now = new Date()): BackupSchedule {
  const current = ensureDate(new Date(now.getTime()));
  return { ...schedule, enabled, updatedAt: current.toISOString(), nextRunAt: enabled ? getNextBackupRunAt(schedule, current) : schedule.nextRunAt, lastError: undefined };
}

export function normalizeBackupSchedules(value: unknown): BackupSchedule[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    try {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<BackupSchedule>;
      if (typeof candidate.id !== "string" || typeof candidate.enabled !== "boolean" || typeof candidate.frequency !== "string" || typeof candidate.hourUTC !== "number" || typeof candidate.weekdayUTC !== "number" || typeof candidate.createdAt !== "string" || typeof candidate.updatedAt !== "string" || typeof candidate.nextRunAt !== "string") return [];
      validateBackupScheduleInput({ frequency: candidate.frequency as BackupScheduleFrequency, hourUTC: candidate.hourUTC, weekdayUTC: candidate.weekdayUTC });
      return [{ ...candidate, frequency: candidate.frequency as BackupScheduleFrequency, lastError: typeof candidate.lastError === "string" ? candidate.lastError : undefined } as BackupSchedule];
    } catch {
      return [];
    }
  });
}

export function getDueBackupSchedules(schedules: BackupSchedule[], now = new Date()): BackupSchedule[] {
  return schedules.filter((schedule) => isBackupScheduleDue(schedule, now)).sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt));
}
