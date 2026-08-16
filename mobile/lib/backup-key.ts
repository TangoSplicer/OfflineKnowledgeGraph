import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const SCHEDULED_BACKUP_PASSPHRASE_KEY = "offline-knowledge-graph.scheduled-backup-passphrase.v1";

const secureOptions: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  authenticationPrompt: "Confirm access to the encrypted backup key.",
};

function validatePassphrase(passphrase: string): string {
  const normalized = passphrase.normalize("NFKC").trim();
  if (normalized.length < 12) throw new Error("Use a backup passphrase with at least 12 characters.");
  return normalized;
}

export async function saveScheduledBackupPassphrase(passphrase: string): Promise<void> {
  const normalized = validatePassphrase(passphrase);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(SCHEDULED_BACKUP_PASSPHRASE_KEY, normalized);
    return;
  }
  await SecureStore.setItemAsync(SCHEDULED_BACKUP_PASSPHRASE_KEY, normalized, secureOptions);
}

export async function getScheduledBackupPassphrase(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(SCHEDULED_BACKUP_PASSPHRASE_KEY);
  try {
    return await SecureStore.getItemAsync(SCHEDULED_BACKUP_PASSPHRASE_KEY, secureOptions);
  } catch {
    return null;
  }
}

export async function clearScheduledBackupPassphrase(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(SCHEDULED_BACKUP_PASSPHRASE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SCHEDULED_BACKUP_PASSPHRASE_KEY);
}
