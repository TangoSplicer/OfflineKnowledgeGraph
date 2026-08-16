import type { BackupSchedule } from "./backup-schedules";

export type BackupStatusSummary = {
  configuredCount: number;
  activeCount: number;
  nextRunAt?: string;
  nextRunLabel: string;
  attention: boolean;
  attentionLabel?: string;
};

export function summarizeBackupSchedules(schedules: BackupSchedule[], now = new Date()): BackupStatusSummary {
  const active = schedules.filter((schedule) => schedule.enabled).sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt));
  const attentionSchedule = schedules.find((schedule) => Boolean(schedule.lastError));
  const nextRunAt = active[0]?.nextRunAt;
  const nextRunDate = nextRunAt ? new Date(nextRunAt) : undefined;
  const nextRunLabel = nextRunDate && !Number.isNaN(nextRunDate.getTime())
    ? `Next ${active[0].frequency} backup ${formatRelativeRun(nextRunDate, now)}`
    : "No automatic backup is scheduled";
  return {
    configuredCount: schedules.length,
    activeCount: active.length,
    nextRunAt,
    nextRunLabel,
    attention: Boolean(attentionSchedule),
    attentionLabel: attentionSchedule?.lastError,
  };
}

function formatRelativeRun(runAt: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((runAt.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours}h`;
  return `on ${runAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
