import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { isSyncProgressActive, type SyncProgressState } from "@/lib/sync-progress";

export function SyncProgressPanel({ progress }: { progress: SyncProgressState }) {
  if (progress.stage === "idle") return null;
  const active = isSyncProgressActive(progress);
  const isComplete = progress.stage === "complete";
  const isError = progress.stage === "error";

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Encrypted graph sync progress"
      accessibilityValue={{ min: 0, max: 100, now: progress.percent, text: progress.label }}
      style={[styles.card, isComplete && styles.complete, isError && styles.error]}
    >
      <View style={styles.header}>
        <View style={[styles.icon, isComplete && styles.completeIcon, isError && styles.errorIcon]}>
          {active ? <ActivityIndicator size="small" color="#C9F7FF" /> : <Text style={styles.iconText}>{isComplete ? "✓" : isError ? "!" : "•"}</Text>}
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{isComplete ? "SYNC COMPLETE" : isError ? "SYNC PAUSED" : progress.stage === "review" ? "REVIEW REQUIRED" : "ENCRYPTED SYNC"}</Text>
          <Text style={styles.label}>{progress.label}</Text>
        </View>
        <Text style={styles.percent}>{progress.percent}%</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress.percent}%` }, isComplete && styles.completeFill, isError && styles.errorFill]} /></View>
      {active ? <Text style={styles.detail}>Your graph remains on this device until the encryption step completes.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 15, padding: 12, backgroundColor: "#152B3A", borderWidth: 1, borderColor: "#397087" },
  complete: { backgroundColor: "#17352D", borderColor: "#3D9677" },
  error: { backgroundColor: "#382131", borderColor: "#86536A" },
  header: { flexDirection: "row", alignItems: "center" },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#24546B" },
  completeIcon: { backgroundColor: "#267357" },
  errorIcon: { backgroundColor: "#82415B" },
  iconText: { color: "#E8FDFF", fontSize: 15, fontWeight: "900" },
  copy: { flex: 1, marginLeft: 9 },
  eyebrow: { color: "#89DCE6", fontSize: 8, letterSpacing: 0.9, fontWeight: "900" },
  label: { color: "#E7F4F6", fontSize: 11, fontWeight: "800", marginTop: 3 },
  percent: { color: "#B9EAF0", fontSize: 11, fontWeight: "900" },
  track: { height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: "#0F1E2D", marginTop: 10 },
  fill: { height: "100%", borderRadius: 3, backgroundColor: "#68D7E6" },
  completeFill: { backgroundColor: "#66D3A6" },
  errorFill: { backgroundColor: "#DE829C" },
  detail: { color: "#A8C5CE", fontSize: 9, lineHeight: 13, marginTop: 7 },
});
