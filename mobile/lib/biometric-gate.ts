import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricGateResult = { allowed: boolean; mode: "biometric" | "passcode" | "passphrase"; message: string };

/**
 * Confirms a sensitive sync operation without storing any biometric or passphrase data.
 * Browser users continue with their already-entered sync passphrase because native
 * biometrics are not available in the web runtime.
 */
export async function confirmSensitiveSyncAction(promptMessage: string): Promise<BiometricGateResult> {
  if (Platform.OS === "web") return { allowed: true, mode: "passphrase", message: "Browser confirmation uses the sync passphrase you entered." };
  const [hasHardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
  if (!hasHardware || !enrolled) return { allowed: true, mode: "passphrase", message: "Biometrics are unavailable on this device, so your sync passphrase remains the confirmation method." };
  const result = await LocalAuthentication.authenticateAsync({ promptMessage, promptDescription: "Confirm this encrypted sync action.", cancelLabel: "Cancel", fallbackLabel: "Use device passcode", disableDeviceFallback: false, requireConfirmation: true, biometricsSecurityLevel: "strong" });
  if (!result.success) return { allowed: false, mode: "biometric", message: result.error === "user_cancel" ? "Confirmation was cancelled." : result.warning || "Biometric confirmation did not complete." };
  return { allowed: true, mode: "biometric", message: "Biometric confirmation complete." };
}
