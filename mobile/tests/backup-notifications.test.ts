import { vi, describe, expect, it, beforeEach } from "vitest";

import { notifyBackupAttention, notifyBackupCompleted } from "../lib/backup-notifications";

const calls = vi.hoisted(() => ({ channel: [] as unknown[], scheduled: [] as unknown[] }));
vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(async (_id: string, value: unknown) => { calls.channel.push(value); }),
  getPermissionsAsync: vi.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: vi.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: vi.fn(async (value: unknown) => { calls.scheduled.push(value); }),
}));

describe("scheduled backup notification cues", () => {
  beforeEach(() => { calls.channel.length = 0; calls.scheduled.length = 0; });

  it("configures the encrypted-backups channel and schedules completion cues", async () => {
    await expect(notifyBackupCompleted(7, "daily")).resolves.toBe(true);
    expect(calls.channel).toHaveLength(1);
    expect(calls.scheduled[0]).toMatchObject({ content: { title: "Encrypted backup completed", data: { scheduleId: "daily", kind: "completed" } }, trigger: null });
  });

  it("uses attention cues for failures and conflicts", async () => {
    await notifyBackupAttention("Review the newer remote graph.", "weekly", "conflict");
    await notifyBackupAttention("Unlock the protected key.", "weekly", "failure");
    expect(calls.scheduled).toHaveLength(2);
    expect(calls.scheduled[0]).toMatchObject({ content: { title: "Encrypted backup needs review", data: { kind: "conflict" } } });
    expect(calls.scheduled[1]).toMatchObject({ content: { title: "Encrypted backup paused", data: { kind: "failure" } } });
  });
});
