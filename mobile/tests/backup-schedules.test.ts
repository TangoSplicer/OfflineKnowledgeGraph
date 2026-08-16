import { describe, expect, it } from "vitest";

import { createBackupSchedule, getNextBackupRunAt, isBackupScheduleDue, markBackupScheduleFailure, markBackupScheduleRun, setBackupScheduleEnabled } from "../lib/backup-schedules";

describe("automatic encrypted backup schedules", () => {
  it("calculates the next daily and weekly UTC run", () => {
    const now = new Date("2026-08-16T10:30:00.000Z");
    expect(getNextBackupRunAt({ frequency: "daily", hourUTC: 10, weekdayUTC: 0 }, now)).toBe("2026-08-17T10:00:00.000Z");
    expect(getNextBackupRunAt({ frequency: "weekly", hourUTC: 9, weekdayUTC: 0 }, now)).toBe("2026-08-23T09:00:00.000Z");
  });

  it("marks only enabled schedules at or after their next run as due", () => {
    const schedule = createBackupSchedule({ id: "daily", frequency: "daily", hourUTC: 9, weekdayUTC: 1, now: new Date("2026-08-16T10:00:00.000Z") });
    expect(isBackupScheduleDue(schedule, new Date("2026-08-17T08:59:00.000Z"))).toBe(false);
    expect(isBackupScheduleDue(schedule, new Date("2026-08-17T09:00:00.000Z"))).toBe(true);
    expect(isBackupScheduleDue(setBackupScheduleEnabled(schedule, false), new Date("2026-08-17T10:00:00.000Z"))).toBe(false);
  });

  it("advances successful and failed schedules without creating an overwrite loop", () => {
    const schedule = createBackupSchedule({ id: "weekly", frequency: "weekly", hourUTC: 9, weekdayUTC: 1, now: new Date("2026-08-16T08:00:00.000Z") });
    const run = markBackupScheduleRun(schedule, new Date("2026-08-17T09:00:00.000Z"));
    expect(run.lastRunAt).toBe("2026-08-17T09:00:00.000Z");
    expect(run.nextRunAt).toBe("2026-08-24T09:00:00.000Z");
    const failed = markBackupScheduleFailure(run, "revision conflict", new Date("2026-08-17T09:05:00.000Z"));
    expect(failed.lastError).toBe("revision conflict");
    expect(failed.nextRunAt).toBe("2026-08-24T09:00:00.000Z");
  });
});
