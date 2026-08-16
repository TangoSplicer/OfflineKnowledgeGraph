import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { runDueEncryptedBackups } from "./backup-runner";

export const ENCRYPTED_BACKUP_TASK = "offline-knowledge-graph.encrypted-backup";

TaskManager.defineTask(ENCRYPTED_BACKUP_TASK, async () => {
  try {
    await runDueEncryptedBackups();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn("[EncryptedBackup] Background task failed", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerEncryptedBackupTask(): Promise<void> {
  if (Platform.OS === "web") return;
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) throw new Error("Background execution is unavailable on this device. Encrypted backups will still run when the app is opened.");
  if (!(await TaskManager.isTaskRegisteredAsync(ENCRYPTED_BACKUP_TASK))) await BackgroundTask.registerTaskAsync(ENCRYPTED_BACKUP_TASK, { minimumInterval: 15 });
}

export async function unregisterEncryptedBackupTask(): Promise<void> {
  if (Platform.OS === "web") return;
  if (await TaskManager.isTaskRegisteredAsync(ENCRYPTED_BACKUP_TASK)) await BackgroundTask.unregisterTaskAsync(ENCRYPTED_BACKUP_TASK);
}

export async function isEncryptedBackupTaskRegistered(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  return TaskManager.isTaskRegisteredAsync(ENCRYPTED_BACKUP_TASK);
}
