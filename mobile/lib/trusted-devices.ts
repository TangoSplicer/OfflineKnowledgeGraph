import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { defaultDeviceLabelForPlatform, normalizeDeviceLabelForPlatform } from "./trusted-device-state";

const DEVICE_ID_KEY = "offline-knowledge-graph.sync-device-id.v1";
export type LocalTrustedDevice = { id: string; label: string; platform: string };

export function defaultDeviceLabel(platform = Platform.OS) { return defaultDeviceLabelForPlatform(platform); }
export function normalizeDeviceLabel(value: string) { return normalizeDeviceLabelForPlatform(value, Platform.OS); }
async function readIdentity() { return Platform.OS === "web" ? AsyncStorage.getItem(DEVICE_ID_KEY) : SecureStore.getItemAsync(DEVICE_ID_KEY); }
async function writeIdentity(value: string) { return Platform.OS === "web" ? AsyncStorage.setItem(DEVICE_ID_KEY, value) : SecureStore.setItemAsync(DEVICE_ID_KEY, value); }

export async function getOrCreateTrustedDevice(): Promise<LocalTrustedDevice> {
  const stored = await readIdentity();
  if (stored) {
    try { const parsed: unknown = JSON.parse(stored); if (parsed && typeof parsed === "object" && typeof (parsed as LocalTrustedDevice).id === "string") return { id: (parsed as LocalTrustedDevice).id, label: normalizeDeviceLabel((parsed as LocalTrustedDevice).label), platform: (parsed as LocalTrustedDevice).platform || Platform.OS }; } catch { /* replace invalid local identity */ }
  }
  const device = { id: Crypto.randomUUID(), label: defaultDeviceLabel(), platform: Platform.OS };
  await writeIdentity(JSON.stringify(device));
  return device;
}
