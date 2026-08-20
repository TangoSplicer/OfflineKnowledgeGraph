import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Stack, router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { parseGraphBackup, serializeGraphBackup } from "@/lib/relationship-backup";
import { useRelationshipStore } from "@/lib/relationship-store";

type LibraryRowProps = {
  title: string;
  detail: string;
  symbol: string;
  onPress: () => void;
};

export default function LibraryScreen() {
  const [backupStatus, setBackupStatus] = useState(
    "Keep a portable JSON backup of your local graph.",
  );
  const {
    concepts,
    archivedConcepts,
    allConcepts,
    connections,
    allConnections,
    isReady,
    replaceGraph,
    loadDemoGraph,
    clearWorkspace,
  } = useRelationshipStore();

  const exportBackup = async () => {
    if (!isReady) return;
    if (Platform.OS === "web") {
      setBackupStatus("Backup export is available in the installed Android app.");
      return;
    }

    try {
      const filename = `offline-knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
      const backupFile = new File(Paths.cache, filename);
      backupFile.create({ overwrite: true, intermediates: true });
      backupFile.write(serializeGraphBackup(allConcepts, allConnections));
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing is unavailable on this device.");
      }
      await Sharing.shareAsync(backupFile.uri, {
        dialogTitle: "Export local graph backup",
        mimeType: "application/json",
      });
      setBackupStatus(
        `${allConcepts.length} concepts and ${allConnections.length} relationships exported locally.`,
      );
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to export a backup right now.");
    }
  };

  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const backup = parseGraphBackup(await new File(result.assets[0].uri).text());
      Alert.alert(
        "Restore local graph backup?",
        `Replace this device's ${concepts.length} concepts and ${connections.length} relationships with ${backup.concepts.length} concepts and ${backup.connections.length} relationships from the selected file?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: () => {
              replaceGraph(backup.concepts, backup.connections);
              setBackupStatus(
                `${backup.concepts.length} concepts and ${backup.connections.length} relationships restored locally.`,
              );
            },
          },
        ],
      );
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to read that backup file.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>LOCAL LIBRARY</Text>
        <Text style={styles.title}>Your thinking, in one place.</Text>
        <Text style={styles.subtitle}>
          Keep the tools you need close. Everything shown here works from this device.
        </Text>

        <View style={styles.graphSummary}>
          <View style={styles.summaryHeading}>
            <View>
              <Text style={styles.summaryEyebrow}>THIS DEVICE</Text>
              <Text style={styles.summaryTitle}>Your local graph</Text>
            </View>
            <View style={styles.localBadge}><View style={styles.localDot} /><Text style={styles.localBadgeText}>Offline</Text></View>
          </View>
          <View style={styles.summaryMetrics}>
            <Metric value={`${concepts.length}`} label="ideas" />
            <View style={styles.metricDivider} />
            <Metric value={`${connections.length}`} label="links" />
            <View style={styles.metricDivider} />
            <Metric value={`${archivedConcepts.length}`} label="archived" />
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/explore")}
            style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
          >
            <Text style={styles.exploreButtonText}>Explore your graph</Text>
            <Text style={styles.exploreButtonArrow}>→</Text>
          </Pressable>
        </View>

        {!concepts.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Start from a blank graph.</Text>
            <Text style={styles.emptyText}>
              Capture a first idea, restore a backup, or load an example only when you want a reference.
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push("/first-concept-wizard")}
                style={({ pressed }) => [styles.emptyPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.emptyPrimaryText}>Create idea</Text>
              </Pressable>
              <Pressable
                onPress={loadDemoGraph}
                style={({ pressed }) => [styles.emptySecondary, pressed && styles.pressed]}
              >
                <Text style={styles.emptySecondaryText}>Load example</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>KEEP ORGANIZED</Text>
        <View style={styles.sectionCard}>
          <LibraryRow
            symbol="◇"
            title="Starting templates"
            detail="Reuse and refine your own concept starting points."
            onPress={() => router.push("/template-library")}
          />
          <LibraryRow
            symbol="↺"
            title={`Archived ideas${archivedConcepts.length ? ` · ${archivedConcepts.length}` : ""}`}
            detail="Restore preserved concepts and their history."
            onPress={() => router.push("/archived-concepts" as never)}
          />
          <LibraryRow
            symbol="↗"
            title="Graph analysis"
            detail="Compare ideas, trace paths, and find useful bridges."
            onPress={() => router.push("/graph-tools" as never)}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>REVIEW AND DEVELOP</Text>
        <View style={styles.sectionCard}>
          <LibraryRow
            symbol="✓"
            title="Evidence review"
            detail="Strengthen unsupported or uncertain relationships."
            onPress={() => router.push("/evidence-review" as never)}
          />
          <LibraryRow
            symbol="?"
            title="Research questions"
            detail="Hold claims, sources, counterpoints, and open gaps."
            onPress={() => router.push("/research-questions" as never)}
          />
          <LibraryRow
            symbol="□"
            title="Capture inbox"
            detail="Collect raw notes before turning them into ideas."
            onPress={() => router.push("/capture-inbox" as never)}
          />
          <LibraryRow
            symbol="◷"
            title="Weekly review"
            detail="Turn small maintenance cues into a focused next step."
            onPress={() => router.push("/weekly-review" as never)}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>MOVE AND PROTECT</Text>
        <View style={styles.sectionCard}>
          <View style={styles.backupBlock}>
            <View style={styles.backupHeading}><Text style={styles.backupTitle}>Local graph backup</Text><Text style={styles.backupPill}>JSON</Text></View>
            <Text style={styles.backupDetail}>
              Export your complete graph or restore it on this device. You remain in control of every file.
            </Text>
            <View style={styles.backupActions}>
              <Pressable disabled={!isReady} onPress={exportBackup} style={({ pressed }) => [styles.backupAction, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.backupActionText}>Export</Text></Pressable>
              <Pressable disabled={!isReady} onPress={importBackup} style={({ pressed }) => [styles.backupAction, styles.restoreAction, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.backupActionText}>Restore</Text></Pressable>
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.backupStatus}>{backupStatus}</Text>
          </View>
          <LibraryRow
            symbol="⇄"
            title="Knowledge exchange"
            detail="Share selected local bundles or review an incoming one."
            onPress={() => router.push("/knowledge-exchange" as never)}
          />
          <LibraryRow
            symbol="▣"
            title="Restore protected export"
            detail="Decrypt a passphrase-protected ZIP and review it before recovery."
            onPress={() => router.push("/restore-protected-export" as never)}
          />
          <LibraryRow
            symbol="◷"
            title="Export history"
            detail="Review recent local archive records and their verified creation times."
            onPress={() => router.push("/export-history" as never)}
          />
          <LibraryRow
            symbol="⌁"
            title="Nearby device transfer"
            detail="Pair a nearby device over local Wi-Fi, Bluetooth, or QR."
            onPress={() => router.push("/device-pairing" as never)}
          />
          <LibraryRow
            symbol="◒"
            title="Local backup routines"
            detail="Schedule protected snapshots that stay under your control."
            onPress={() => router.push("/backup-schedules" as never)}
            last
          />
        </View>

        {concepts.length ? (
          <Pressable
            onPress={() => Alert.alert(
              "Clear this local graph?",
              "This removes the concepts and relationships currently stored on this device.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Clear graph", style: "destructive", onPress: clearWorkspace },
              ],
            )}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Text style={styles.clearButtonText}>Start over with an empty graph</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function LibraryRow({ title, detail, symbol, onPress, last = false }: LibraryRowProps & { last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.libraryRow, !last && styles.libraryRowDivider, pressed && styles.pressed]}>
      <View style={styles.rowSymbol}><Text style={styles.rowSymbolText}>{symbol}</Text></View>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 112 },
  eyebrow: { color: "#48D6E8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  title: { color: "#F3F6FC", fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: "#9CA9C4", fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 335 },
  graphSummary: { marginTop: 21, borderRadius: 22, padding: 17, backgroundColor: "#111B2E", borderWidth: 1, borderColor: "#344666" },
  summaryHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  summaryEyebrow: { color: "#6E819E", fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  summaryTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800", marginTop: 5 },
  localBadge: { flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: "#153438", paddingHorizontal: 9, paddingVertical: 5 },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#72D6AD", marginRight: 6 },
  localBadgeText: { color: "#B7ECD7", fontSize: 10, fontWeight: "900" },
  summaryMetrics: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 19, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#263553" },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { color: "#EAF0FA", fontSize: 18, fontWeight: "900" },
  metricLabel: { color: "#8493AA", fontSize: 10, fontWeight: "800", marginTop: 3 },
  metricDivider: { width: 1, height: 26, backgroundColor: "#30405D" },
  exploreButton: { minHeight: 45, borderRadius: 13, backgroundColor: "#272660", paddingHorizontal: 14, marginTop: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exploreButtonText: { color: "#E8E7FF", fontSize: 13, fontWeight: "900" },
  exploreButtonArrow: { color: "#B9B3FF", fontSize: 19, fontWeight: "900" },
  emptyCard: { marginTop: 16, borderRadius: 18, padding: 15, backgroundColor: "#142738", borderWidth: 1, borderColor: "#365C76" },
  emptyTitle: { color: "#E2F2F6", fontSize: 15, fontWeight: "900" },
  emptyText: { color: "#A5C0CB", fontSize: 12, lineHeight: 18, marginTop: 5 },
  emptyActions: { flexDirection: "row", gap: 9, marginTop: 13 },
  emptyPrimary: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#48B8C6" },
  emptyPrimaryText: { color: "#07151B", fontSize: 12, fontWeight: "900" },
  emptySecondary: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#52788C", backgroundColor: "#173244" },
  emptySecondaryText: { color: "#C5EAF0", fontSize: 12, fontWeight: "900" },
  sectionLabel: { color: "#73839E", fontSize: 10, fontWeight: "900", letterSpacing: 1.05, marginTop: 27, marginBottom: 9 },
  sectionCard: { borderRadius: 19, backgroundColor: "#111A2B", borderWidth: 1, borderColor: "#2B3955", overflow: "hidden" },
  libraryRow: { minHeight: 70, paddingHorizontal: 13, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  libraryRowDivider: { borderBottomWidth: 1, borderColor: "#25334D" },
  rowSymbol: { width: 33, height: 33, borderRadius: 11, backgroundColor: "#1C2B46", alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowSymbolText: { color: "#84E3EA", fontSize: 16, fontWeight: "800" },
  rowCopy: { flex: 1, paddingRight: 10 },
  rowTitle: { color: "#EEF2FA", fontSize: 13, fontWeight: "900" },
  rowDetail: { color: "#92A1B9", fontSize: 11, lineHeight: 16, marginTop: 3 },
  rowArrow: { color: "#9DACCA", fontSize: 24, lineHeight: 24 },
  backupBlock: { padding: 14, backgroundColor: "#142837", borderBottomWidth: 1, borderColor: "#2D4A62" },
  backupHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backupTitle: { color: "#D9F3F5", fontSize: 14, fontWeight: "900" },
  backupPill: { color: "#8BE8E9", fontSize: 9, letterSpacing: 0.8, fontWeight: "900", borderRadius: 7, backgroundColor: "#204957", paddingHorizontal: 7, paddingVertical: 4 },
  backupDetail: { color: "#A5C6CD", fontSize: 11, lineHeight: 16, marginTop: 5 },
  backupActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  backupAction: { flex: 1, minHeight: 39, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#275766" },
  restoreAction: { backgroundColor: "#29305A" },
  backupActionText: { color: "#E8FAFB", fontSize: 11, fontWeight: "900" },
  backupStatus: { color: "#8EAEB8", fontSize: 10, lineHeight: 15, marginTop: 10 },
  clearButton: { alignSelf: "center", marginTop: 25, paddingHorizontal: 12, paddingVertical: 8 },
  clearButtonText: { color: "#E9A78E", fontSize: 11, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
