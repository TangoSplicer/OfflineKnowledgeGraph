import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const BACKUP_NOTIFICATION_CHANNEL = "encrypted-backups";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureBackupNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(BACKUP_NOTIFICATION_CHANNEL, {
      name: "Encrypted backups",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 100, 150],
      lightColor: "#78DCE6",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function notifyBackupCompleted(revision: number, scheduleId: string): Promise<boolean> {
  if (!(await configureBackupNotifications())) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Encrypted backup completed",
      body: `Your local graph is protected at revision ${revision}.`,
      data: { url: "/backup-schedules", scheduleId, kind: "completed" },
      ...(Platform.OS === "android" ? { channelId: BACKUP_NOTIFICATION_CHANNEL } : {}),
    },
    trigger: null,
  });
  return true;
}

export async function notifyBackupAttention(message: string, scheduleId: string, kind: "failure" | "conflict"): Promise<boolean> {
  if (!(await configureBackupNotifications())) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: kind === "conflict" ? "Encrypted backup needs review" : "Encrypted backup paused",
      body: message,
      data: { url: "/backup-schedules", scheduleId, kind },
      ...(Platform.OS === "android" ? { channelId: BACKUP_NOTIFICATION_CHANNEL } : {}),
    },
    trigger: null,
  });
  return true;
}
