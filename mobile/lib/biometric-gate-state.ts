export type SensitiveSyncAction = "feedback-recovery" | "feedback-upload" | "feedback-delete" | "graph-recovery" | "graph-upload" | "graph-delete" | "device-revoke" | "protected-export" | "protected-restore";
const prompts: Record<SensitiveSyncAction, string> = {
  "feedback-recovery": "Confirm encrypted profile recovery",
  "feedback-upload": "Confirm encrypted profile upload",
  "feedback-delete": "Confirm remote encrypted profile removal",
  "graph-recovery": "Confirm complete graph recovery",
  "graph-upload": "Confirm encrypted complete graph upload",
  "graph-delete": "Confirm remote encrypted graph removal",
  "device-revoke": "Confirm trusted device revocation",
  "protected-export": "Confirm protected local export",
  "protected-restore": "Confirm protected export restore",
};
export function biometricPromptFor(action: SensitiveSyncAction) { return prompts[action]; }
export function requiresSensitiveSyncConfirmation(action: string): action is SensitiveSyncAction { return action in prompts; }
