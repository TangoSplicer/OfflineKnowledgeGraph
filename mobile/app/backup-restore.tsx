import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { parseGraphBackup, serializeGraphBackup, type GraphBackup } from "@/lib/relationship-backup";
import { loadPreRestoreSnapshot, savePreRestoreSnapshot, type PreRestoreSnapshot } from "@/lib/pre-restore-snapshot";
import { useRelationshipStore } from "@/lib/relationship-store";
import { useColors } from "@/hooks/use-colors";

type ConfirmKind = "restore-json" | "restore-snapshot" | "clear";
const CONFIRM_WORDS: Record<ConfirmKind, string> = {
  "restore-json": "REPLACE",
  "restore-snapshot": "RESTORE",
  clear: "CLEAR",
};
const CONFIRM_COPY: Record<ConfirmKind, string> = {
  "restore-json": "Restoring replaces the graph on this device. A snapshot of the current graph is saved first, so you can undo it from this screen.",
  "restore-snapshot": "Restoring the snapshot replaces the current graph with the graph saved before your last restore.",
  clear: "Starting over removes every concept and relationship on this device. A snapshot of the current graph is saved first, so you can undo it from this screen.",
};

/**
 * The single Backup & restore screen. One recommended path (passphrase-
 * protected ZIP, created on Home), plain JSON as an explicitly advanced and
 * unprotected option, and every replace/clear behind a typed confirmation
 * plus an automatic pre-restore snapshot. The protected-ZIP restore flow
 * keeps its own verify-before-replace preview on /restore-protected-export.
 */
export default function BackupRestoreScreen() {
  const colors = useColors();
  const { concepts, allConcepts, allConnections, isReady, replaceGraph, clearWorkspace } = useRelationshipStore();
  const [status, setStatus] = useState("Everything here stays on this device. Choose one path and keep the file somewhere safe.");
  const [snapshot, setSnapshot] = useState<PreRestoreSnapshot | null>(null);
  const [pendingBackup, setPendingBackup] = useState<GraphBackup | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const refreshSnapshot = useCallback(() => {
    void loadPreRestoreSnapshot().then(setSnapshot).catch(() => setSnapshot(null));
  }, []);
  useFocusEffect(refreshSnapshot);

  const armConfirm = (kind: ConfirmKind) => { setConfirmKind(kind); setConfirmText(""); };
  const cancelConfirm = () => { setConfirmKind(null); setConfirmText(""); };

  const exportJsonBackup = async () => {
    if (!isReady) return;
    try {
      const filename = `offline-knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
      const serialized = serializeGraphBackup(allConcepts, allConnections);
      if (Platform.OS === "web") {
        const blob = new Blob([serialized], { type: "application/json" });
        const objectUrl = URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.href = objectUrl;
        download.download = filename;
        download.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        const backupFile = new File(Paths.cache, filename);
        backupFile.create({ overwrite: true, intermediates: true });
        backupFile.write(serialized);
        if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
        await Sharing.shareAsync(backupFile.uri, { dialogTitle: "Export local graph backup", mimeType: "application/json" });
      }
      setStatus(`${allConcepts.length} concepts and ${allConnections.length} relationships exported as an unprotected JSON backup. Anyone with the file can read it.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to export a backup right now.");
    }
  };

  const chooseJsonBackup = async () => {
    if (!isReady) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const backup = parseGraphBackup(await new File(result.assets[0].uri).text());
      setPendingBackup(backup);
      setStatus(`This JSON backup contains ${backup.concepts.length} concepts and ${backup.connections.length} relationships. Review it below before replacing anything.`);
    } catch (error) {
      setPendingBackup(null);
      setStatus(error instanceof Error ? error.message : "Unable to read that backup file.");
    }
  };

  const confirmDestructive = async () => {
    if (!confirmKind) return;
    if (confirmKind === "restore-json") {
      if (!pendingBackup) return;
      await savePreRestoreSnapshot(allConcepts, allConnections);
      replaceGraph(pendingBackup.concepts, pendingBackup.connections);
      setStatus(`Restored ${pendingBackup.concepts.length} concepts and ${pendingBackup.connections.length} relationships. Your previous graph was saved as a snapshot — restore it below if this was a mistake.`);
      setPendingBackup(null);
      refreshSnapshot();
    } else if (confirmKind === "restore-snapshot") {
      if (!snapshot) return;
      await savePreRestoreSnapshot(allConcepts, allConnections);
      replaceGraph(snapshot.backup.concepts, snapshot.backup.connections);
      setStatus(`Snapshot restored: ${snapshot.backup.concepts.length} concepts and ${snapshot.backup.connections.length} relationships.`);
      refreshSnapshot();
    } else {
      await savePreRestoreSnapshot(allConcepts, allConnections);
      clearWorkspace();
      setStatus("Your graph is empty. The snapshot taken before clearing was kept — restore it below if this was a mistake.");
      refreshSnapshot();
    }
    cancelConfirm();
  };

  const restoreSnapshot = async () => {
    if (!snapshot) return;
    armConfirm("restore-snapshot");
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={[styles.headerTitle, { color: colors.text }]}>Backup &amp; restore</Text><View style={styles.headerSpace} /></View>
        <Text style={styles.eyebrow}>BACKUP &amp; SAFETY</Text>
        <Text style={[styles.title, { color: colors.text }]}>Keep one safe copy.</Text>
        <Text style={styles.subtitle}>One recommended path, and the advanced options clearly marked. Restoring replaces the graph on this device — a snapshot is saved first, every time.</Text>

        <View style={[styles.card, styles.recommendedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.cardEyebrow}>RECOMMENDED · PROTECTED ZIP</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Passphrase-protected export</Text>
          <Text style={styles.cardText}>A ZIP protected by a passphrase of 12+ characters. The passphrase stays on this device only and cannot be recovered if forgotten — that is by design, so nobody else can open your graph.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Create a protected ZIP export on Home" disabled={!isReady} onPress={() => router.push("/(tabs)" as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.primaryButtonText}>Create a protected ZIP</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Restore a protected ZIP export, with verification first" onPress={() => router.push("/restore-protected-export" as never)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Restore a protected ZIP</Text><Text style={styles.secondaryButtonArrow}>→</Text></Pressable>
          <Text style={styles.cardHint}>Restoring a protected ZIP verifies and previews it before anything is replaced.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.cardEyebrow}>ADVANCED · UNPROTECTED</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Plain JSON backup</Text>
          <Text style={styles.cardText}>A readable JSON file with no passphrase. Use it only when you understand that anyone with the file can read your graph. Prefer the protected ZIP above.</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel="Export graph as unprotected JSON" disabled={!isReady} onPress={() => void exportJsonBackup()} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.actionButtonText}>Export JSON</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose a JSON backup to restore" disabled={!isReady} onPress={() => void chooseJsonBackup()} style={({ pressed }) => [styles.actionButton, styles.actionButtonAlt, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.actionButtonText}>Restore JSON</Text></Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Import only some concepts from a JSON backup" onPress={() => router.push("/restore-backup" as never)} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}><Text style={styles.textButtonText}>Import only some concepts instead →</Text></Pressable>
          {pendingBackup ? <View style={styles.preview}><Text style={styles.previewEyebrow}>JSON BACKUP READY</Text><Text style={styles.previewText}>{pendingBackup.concepts.length} concepts · {pendingBackup.connections.length} relationships · exported {new Date(pendingBackup.exportedAt).toLocaleDateString()}</Text><Text style={styles.previewWarning}>Restoring replaces this device&apos;s current graph of {concepts.length} concepts and {allConnections.length} relationships.</Text><Pressable accessibilityRole="button" accessibilityLabel="Replace current graph with this JSON backup" onPress={() => armConfirm("restore-json")} style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}><Text style={styles.dangerButtonText}>Replace with this backup</Text></Pressable></View> : null}
        </View>

        {snapshot ? <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.cardEyebrow}>UNDO A RESTORE</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Snapshot before your last restore</Text>
          <Text style={styles.cardText}>Saved {new Date(snapshot.savedAt).toLocaleString()} — {snapshot.backup.concepts.length} concepts and {snapshot.backup.connections.length} relationships. Restoring it replaces the current graph.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Restore the snapshot taken before the last restore" disabled={!isReady} onPress={() => void restoreSnapshot()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.secondaryButtonText}>Restore snapshot</Text><Text style={styles.secondaryButtonArrow}>→</Text></Pressable>
        </View> : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.cardEyebrow}>START OVER</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Start over with an empty graph</Text>
          <Text style={styles.cardText}>Removes every concept and relationship on this device. A snapshot is saved first, so you can undo it from this screen.</Text>
          {concepts.length ? <Pressable accessibilityRole="button" accessibilityLabel="Start over with an empty graph" onPress={() => armConfirm("clear")} style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}><Text style={styles.dangerButtonText}>Start over with an empty graph</Text></Pressable> : <Text style={styles.cardHint}>Your graph is already empty.</Text>}
        </View>

        {confirmKind ? <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.confirmEyebrow}>TYPE TO CONFIRM</Text>
          <Text style={[styles.confirmTitle, { color: colors.text }]}>Type {CONFIRM_WORDS[confirmKind]} to continue</Text>
          <Text style={styles.confirmText}>{CONFIRM_COPY[confirmKind]}</Text>
          <TextInput value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} placeholder={CONFIRM_WORDS[confirmKind]} placeholderTextColor="#71809A" accessibilityLabel={`Type ${CONFIRM_WORDS[confirmKind]} to confirm`} style={styles.confirmInput} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Confirm by typing ${CONFIRM_WORDS[confirmKind]}`} disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORDS[confirmKind]} onPress={() => void confirmDestructive()} style={({ pressed }) => [styles.dangerButton, confirmText.trim().toUpperCase() !== CONFIRM_WORDS[confirmKind] && styles.disabled, pressed && styles.pressed]}><Text style={styles.dangerButtonText}>Confirm</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel, keep current graph" onPress={cancelConfirm} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}><Text style={styles.textButtonText}>Cancel</Text></Pressable>
        </View> : null}

        <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" },
  backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerTitle: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  headerSpace: { width: 44 },
  eyebrow: { color: "#48D6E8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  title: { color: "#F3F6FC", fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: "#9CA9C4", fontSize: 14, lineHeight: 20, marginTop: 8 },
  card: { marginTop: 16, borderRadius: 20, padding: 16, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#2E3D5D" },
  recommendedCard: { borderColor: "#39788A" },
  cardEyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" },
  cardTitle: { color: "#F3F6FC", fontSize: 17, fontWeight: "800", marginTop: 5 },
  cardText: { color: "#A8B5CB", fontSize: 13, lineHeight: 19, marginTop: 7 },
  cardHint: { color: "#8EAEB8", fontSize: 12, lineHeight: 17, marginTop: 10 },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: "#7C6CFF", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  primaryButtonArrow: { color: "#FFFFFF", fontSize: 20 },
  secondaryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: "#3D7390", backgroundColor: "#152C3E", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9 },
  secondaryButtonText: { color: "#BFEAF0", fontSize: 13, fontWeight: "900" },
  secondaryButtonArrow: { color: "#77D9E6", fontSize: 19 },
  row: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionButton: { flex: 1, minHeight: 44, borderRadius: 11, justifyContent: "center", alignItems: "center", backgroundColor: "#275766" },
  actionButtonAlt: { backgroundColor: "#29305A" },
  actionButtonText: { color: "#E8FAFB", fontSize: 13, fontWeight: "900" },
  textButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 6 },
  textButtonText: { color: "#B9B2FF", fontSize: 13, fontWeight: "800" },
  dangerButton: { minHeight: 48, borderRadius: 13, backgroundColor: "#5A2E3D", borderWidth: 1, borderColor: "#8A4A5E", paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
  dangerButtonText: { color: "#F4BAC6", fontSize: 13, fontWeight: "900" },
  preview: { borderRadius: 14, padding: 13, marginTop: 14, backgroundColor: "#25203C", borderWidth: 1, borderColor: "#665B9E" },
  previewEyebrow: { color: "#C3BCFF", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  previewText: { color: "#F2F0FF", fontSize: 13, fontWeight: "800", marginTop: 6 },
  previewWarning: { color: "#C9C3E7", fontSize: 12, lineHeight: 17, marginTop: 6 },
  confirmCard: { marginTop: 16, borderRadius: 20, padding: 16, backgroundColor: "#2A1A2A", borderWidth: 1, borderColor: "#704051" },
  confirmEyebrow: { color: "#F4BAC6", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" },
  confirmTitle: { color: "#F3F6FC", fontSize: 17, fontWeight: "900", marginTop: 5 },
  confirmText: { color: "#C9A8B2", fontSize: 13, lineHeight: 19, marginTop: 7 },
  confirmInput: { minHeight: 48, borderRadius: 12, paddingHorizontal: 13, marginTop: 12, color: "#F3F6FC", backgroundColor: "#0E1627", borderWidth: 1, borderColor: "#704051", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  status: { color: "#8EAEB8", fontSize: 13, lineHeight: 19, marginTop: 16 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
