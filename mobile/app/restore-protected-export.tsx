import { Stack, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { biometricPromptFor } from "@/lib/biometric-gate-state";
import { decryptProtectedExportGraph, validateExportPassphrase } from "@/lib/home-local-export";
import type { GraphBackup } from "@/lib/relationship-backup";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function RestoreProtectedExportScreen() {
  const { concepts, connections, isReady, replaceGraph } = useRelationshipStore();
  const [passphrase, setPassphrase] = useState("");
  const [pendingBackup, setPendingBackup] = useState<GraphBackup | null>(null);
  const [status, setStatus] = useState("Choose a protected export and enter its passphrase to inspect it locally.");

  const inspectProtectedExport = async () => {
    if (!isReady) return;
    const validation = validateExportPassphrase(passphrase, passphrase);
    if (!validation.valid) { setStatus(validation.message); return; }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/zip", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const protectedBundle = await new File(result.assets[0].uri).bytes();
      const backup = await decryptProtectedExportGraph(protectedBundle, passphrase);
      setPendingBackup(backup);
      setStatus(`Protected export verified locally. It contains ${backup.concepts.length} concepts and ${backup.connections.length} relationships.`);
    } catch (error) {
      setPendingBackup(null);
      setStatus(error instanceof Error ? error.message : "Unable to decrypt that protected export.");
    }
  };

  const restoreProtectedExport = async () => {
    if (!pendingBackup) return;
    const gate = await confirmSensitiveSyncAction(biometricPromptFor("protected-restore"));
    if (!gate.allowed) { setStatus(gate.message); return; }
    replaceGraph(pendingBackup.concepts, pendingBackup.connections);
    setPassphrase("");
    router.replace("/(tabs)/library");
  };

  return <View style={styles.screen}><Stack.Screen options={{ headerShown: false }} /><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Restore protected export</Text><View style={styles.headerSpace} /></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.eyebrow}>LOCAL RECOVERY</Text><Text style={styles.title}>Open a protected graph export.</Text><Text style={styles.description}>The archive is decrypted only on this device. Your passphrase is never stored or transmitted.</Text><View style={styles.inputCard}><Text style={styles.inputLabel}>EXPORT PASSPHRASE</Text><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Enter the export passphrase" placeholderTextColor="#718A96" accessibilityLabel="Protected export passphrase" style={styles.input} /><Text style={styles.guidance}>Use the exact passphrase from export. It cannot be recovered if forgotten.</Text><Pressable disabled={!isReady} onPress={() => void inspectProtectedExport()} style={({ pressed }) => [styles.primary, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.primaryText}>Choose protected ZIP</Text><Text style={styles.arrow}>→</Text></Pressable></View>{pendingBackup ? <View style={styles.preview}><Text style={styles.previewEyebrow}>VERIFIED ARCHIVE</Text><Text style={styles.previewTitle}>Ready to restore locally</Text><View style={styles.metrics}><Metric value={`${pendingBackup.concepts.length}`} label="concepts" /><Metric value={`${pendingBackup.connections.length}`} label="links" /><Metric value={new Date(pendingBackup.exportedAt).toLocaleDateString()} label="exported" /></View><Text style={styles.warning}>Restoring replaces this device’s current graph of {concepts.length} concepts and {connections.length} relationships.</Text><Pressable onPress={() => void restoreProtectedExport()} style={({ pressed }) => [styles.restore, pressed && styles.pressed]}><Text style={styles.restoreText}>Confirm and restore</Text><Text style={styles.arrow}>→</Text></Pressable></View> : null}<Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text></ScrollView></View>;
}

function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 },
  header: { height: 52, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" },
  backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerTitle: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  headerSpace: { width: 40 },
  content: { paddingHorizontal: 24, paddingTop: 38, paddingBottom: 48 },
  eyebrow: { color: "#68DCE5", fontSize: 10, letterSpacing: 1.15, fontWeight: "900" },
  title: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", marginTop: 8 },
  description: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 10 },
  inputCard: { borderRadius: 18, padding: 15, marginTop: 23, backgroundColor: "#142A38", borderWidth: 1, borderColor: "#3B7283" },
  inputLabel: { color: "#85DFE4", fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  input: { minHeight: 44, borderRadius: 11, paddingHorizontal: 12, marginTop: 9, color: "#F0FEFF", backgroundColor: "#0D222D", borderWidth: 1, borderColor: "#3F7987", fontSize: 12 },
  guidance: { color: "#A4C9D0", fontSize: 10, lineHeight: 15, marginTop: 8 },
  primary: { minHeight: 47, borderRadius: 13, paddingHorizontal: 14, marginTop: 13, backgroundColor: "#347F8B", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryText: { color: "#F0FEFF", fontSize: 12, fontWeight: "900" },
  arrow: { color: "#F0FEFF", fontSize: 19, fontWeight: "900" },
  preview: { borderRadius: 18, padding: 15, marginTop: 17, backgroundColor: "#25203C", borderWidth: 1, borderColor: "#665B9E" },
  previewEyebrow: { color: "#C3BCFF", fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  previewTitle: { color: "#F2F0FF", fontSize: 17, fontWeight: "900", marginTop: 5 },
  metrics: { flexDirection: "row", marginTop: 13, paddingVertical: 11, borderRadius: 11, backgroundColor: "#1C1931" },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { color: "#F3F0FF", fontSize: 13, fontWeight: "900" },
  metricLabel: { color: "#AAA5D2", fontSize: 9, marginTop: 3, fontWeight: "800" },
  warning: { color: "#C9C3E7", fontSize: 10, lineHeight: 15, marginTop: 12 },
  restore: { minHeight: 46, borderRadius: 13, paddingHorizontal: 14, marginTop: 13, backgroundColor: "#6258A8", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  restoreText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  status: { color: "#9AB2C1", fontSize: 11, lineHeight: 17, marginTop: 17 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
