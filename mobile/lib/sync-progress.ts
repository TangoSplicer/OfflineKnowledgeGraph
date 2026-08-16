export type SyncProgressStage = "idle" | "authorizing" | "fetching" | "encrypting" | "uploading" | "decrypting" | "verifying" | "review" | "complete" | "error";

export type SyncProgressState = {
  stage: SyncProgressStage;
  percent: number;
  label: string;
};

const PROGRESS: Record<SyncProgressStage, Omit<SyncProgressState, "stage">> = {
  idle: { percent: 0, label: "" },
  authorizing: { percent: 8, label: "Waiting for device confirmation" },
  fetching: { percent: 24, label: "Retrieving encrypted envelope" },
  encrypting: { percent: 48, label: "Encrypting graph on this device" },
  uploading: { percent: 72, label: "Uploading encrypted envelope" },
  decrypting: { percent: 55, label: "Decrypting graph on this device" },
  verifying: { percent: 88, label: "Verifying graph integrity" },
  review: { percent: 92, label: "Ready for your conflict review" },
  complete: { percent: 100, label: "Encrypted sync complete" },
  error: { percent: 0, label: "Sync needs your attention" },
};

export function syncProgress(stage: SyncProgressStage, label?: string): SyncProgressState {
  return { stage, ...PROGRESS[stage], ...(label ? { label } : {}) };
}

export function isSyncProgressActive(progress: SyncProgressState): boolean {
  return !["idle", "review", "complete", "error"].includes(progress.stage);
}
