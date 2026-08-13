import { Stack, router } from "expo-router";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { ScreenContainer } from "@/components/screen-container";
import { graphCollections } from "@/lib/knowledge-data";
import { parseGraphBackup, serializeGraphBackup } from "@/lib/relationship-backup";
import { useRelationshipStore } from "@/lib/relationship-store";
import { calculateRelationshipStatistics, type RelationshipStatistics } from "@/lib/relationship-statistics";

export default function LibraryScreen() {
  const [lowMotion, setLowMotion] = useState(false);
  const [backupStatus, setBackupStatus] = useState("Create a portable JSON backup before moving to another device.");
  const { concepts, connections, isReady, replaceGraph, loadDemoGraph, clearWorkspace } = useRelationshipStore();
  const relationshipStats = calculateRelationshipStatistics(connections);

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
      backupFile.write(serializeGraphBackup(concepts, connections));
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
      await Sharing.shareAsync(backupFile.uri, { dialogTitle: "Export complete graph backup", mimeType: "application/json" });
      setBackupStatus(`${concepts.length} concepts and ${connections.length} relationships packaged in a JSON backup.`);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to export a backup right now.");
    }
  };

  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const backup = parseGraphBackup(await new File(result.assets[0].uri).text());
      Alert.alert("Restore complete graph backup?", `This will replace ${concepts.length} concepts and ${connections.length} relationships with ${backup.concepts.length} concepts and ${backup.connections.length} relationships from the selected backup.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", style: "destructive", onPress: () => { replaceGraph(backup.concepts, backup.connections); setBackupStatus(`${backup.concepts.length} concepts and ${backup.connections.length} relationships restored from backup.`); } },
      ]);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to read that backup file.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={concepts.length ? graphCollections : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>LOCAL LIBRARY</Text>
            <Text style={styles.title}>Your graphs</Text>
            <Text style={styles.subtitle}>Everything here is available offline on this device.</Text>
            <Pressable onPress={() => router.push("/first-concept-wizard")} style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
              <Text style={styles.newButtonText}>＋  Create local graph</Text>
            </Pressable>
            {concepts.length ? <Text style={styles.sectionLabel}>COLLECTIONS</Text> : <View style={styles.emptyLibraryCard}><Text style={styles.emptyLibraryEyebrow}>NOTHING PRELOADED</Text><Text style={styles.emptyLibraryTitle}>Your library is ready for your first idea.</Text><Text style={styles.emptyLibraryText}>Create a concept to begin, or load the demo graph if you want to see how collections and relationships work.</Text><View style={styles.emptyLibraryActions}><Pressable onPress={() => router.push("/first-concept-wizard")} style={({ pressed }) => [styles.emptyPrimary, pressed && styles.pressed]}><Text style={styles.emptyPrimaryText}>Create concept</Text></Pressable><Pressable onPress={loadDemoGraph} style={({ pressed }) => [styles.emptyDemo, pressed && styles.pressed]}><Text style={styles.emptyDemoText}>Load demo</Text></Pressable></View></View>}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push("/(tabs)/explore")} style={({ pressed }) => [styles.collection, pressed && styles.pressed]}>
            <View style={[styles.collectionMark, { backgroundColor: item.color }]}><Text style={styles.collectionGlyph}>◇</Text></View>
            <View style={styles.collectionCopy}>
              <Text style={styles.collectionTitle}>{item.name}</Text>
              <Text style={styles.collectionDescription} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.collectionMeta}>{item.nodeCount} concepts · {item.updatedAt}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.settingsCard}>
            <RelationshipDashboard stats={relationshipStats} />
            <Text style={styles.settingsTitle}>Research preferences</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Reduce visual motion</Text>
                <Text style={styles.settingDetail}>Keep transitions minimal while exploring.</Text>
              </View>
              <Switch value={lowMotion} onValueChange={setLowMotion} trackColor={{ false: "#33415F", true: "#7C6CFF" }} thumbColor="#F3F6FC" />
            </View>
            <View style={styles.storageRow}><View style={styles.storageDot} /><Text style={styles.storageText}>Local graph storage is healthy</Text></View>
            {concepts.length ? <Pressable onPress={() => Alert.alert("Clear this workspace?", "This removes the current local concepts and relationships from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Clear workspace", style: "destructive", onPress: clearWorkspace }])} style={({ pressed }) => [styles.clearWorkspace, pressed && styles.pressed]}><Text style={styles.clearWorkspaceText}>Start over with an empty workspace</Text></Pressable> : null}
            <View style={backupStyles.section}>
              <Text style={backupStyles.title}>Complete graph backup</Text>
              <Text style={backupStyles.detail}>Export concepts, relationships, and relationship notes as JSON, then restore the complete graph on another device.</Text>
              <View style={backupStyles.actions}><Pressable disabled={!isReady} onPress={exportBackup} style={({ pressed }) => [backupStyles.action, pressed && styles.pressed, !isReady && backupStyles.disabled]}><Text style={backupStyles.actionText}>Export JSON</Text></Pressable><Pressable disabled={!isReady} onPress={importBackup} style={({ pressed }) => [backupStyles.action, backupStyles.importAction, pressed && styles.pressed, !isReady && backupStyles.disabled]}><Text style={backupStyles.actionText}>Restore JSON</Text></Pressable></View>
              <Text style={backupStyles.status}>{backupStatus}</Text>
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function RelationshipDashboard({ stats }: { stats: RelationshipStatistics }) {
  const maxTypeCount = Math.max(1, ...stats.byType.map((entry) => entry.count));
  return <View style={statsStyles.dashboard}>
    <View style={statsStyles.heading}><View><Text style={statsStyles.eyebrow}>GRAPH SIGNALS</Text><Text style={statsStyles.title}>Relationship profile</Text></View><Text style={statsStyles.total}>{stats.total} total</Text></View>
    <View style={statsStyles.summaryRow}><Stat label="Noted" value={`${stats.noted}`} /><Stat label="Avg. strength" value={stats.averageStrength.toFixed(1)} /><Stat label="Concepts" value={`${stats.total ? "active" : "ready"}`} /></View>
    <Text style={statsStyles.sectionLabel}>BY RELATIONSHIP TYPE</Text>
    <View style={statsStyles.typeList}>{stats.byType.filter((entry) => entry.count > 0).map((entry) => <View key={entry.type} style={statsStyles.typeRow}><Text style={statsStyles.typeName}>{entry.type}</Text><View style={statsStyles.track}><View style={[statsStyles.fill, { width: `${(entry.count / maxTypeCount) * 100}%` }]} /></View><Text style={statsStyles.typeCount}>{entry.count}</Text></View>)}</View>
    <Text style={statsStyles.sectionLabel}>BY CONNECTION STRENGTH</Text>
    <View style={statsStyles.strengthRow}>{stats.byStrength.map((entry) => <View key={entry.strength} style={statsStyles.strengthColumn}><View style={statsStyles.strengthTrack}><View style={[statsStyles.strengthFill, { height: `${Math.max(entry.ratio * 100, entry.count ? 8 : 0)}%` }]} /></View><Text style={statsStyles.strengthNumber}>{entry.count}</Text><Text style={statsStyles.strengthLabel}>{entry.strength}</Text></View>)}</View>
  </View>;
}

function Stat({ label, value }: { label: string; value: string }) { return <View style={statsStyles.stat}><Text style={statsStyles.statValue}>{value}</Text><Text style={statsStyles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 116 },
  eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  title: { color: "#F3F6FC", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: "#9CA9C4", fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 310 },
  newButton: { height: 50, borderRadius: 16, backgroundColor: "#7C6CFF", alignItems: "center", justifyContent: "center", marginTop: 22, marginBottom: 27 },
  newButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  sectionLabel: { color: "#7C89A5", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 }, emptyLibraryCard: { borderRadius: 21, padding: 17, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#394677", marginBottom: 8 }, emptyLibraryEyebrow: { color: "#48D6E8", fontSize: 9, letterSpacing: 1, fontWeight: "900" }, emptyLibraryTitle: { color: "#F3F6FC", fontSize: 18, lineHeight: 23, fontWeight: "800", marginTop: 5 }, emptyLibraryText: { color: "#9EABC3", fontSize: 12, lineHeight: 18, marginTop: 6 }, emptyLibraryActions: { flexDirection: "row", gap: 8, marginTop: 14 }, emptyPrimary: { flex: 1, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#7C6CFF" }, emptyPrimaryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, emptyDemo: { flex: 1, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#1F2944", borderWidth: 1, borderColor: "#45567A" }, emptyDemoText: { color: "#CDD5E6", fontSize: 12, fontWeight: "900" }, clearWorkspace: { alignSelf: "flex-start", paddingVertical: 8, marginTop: 3, marginBottom: 12 }, clearWorkspaceText: { color: "#FFAD88", fontSize: 11, fontWeight: "800" },
  collection: { minHeight: 118, borderRadius: 22, padding: 15, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#26314B", marginBottom: 10, flexDirection: "row", alignItems: "center" },
  collectionMark: { width: 46, height: 46, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 13 },
  collectionGlyph: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  collectionCopy: { flex: 1, paddingRight: 6 },
  collectionTitle: { color: "#F3F6FC", fontSize: 16, fontWeight: "800" },
  collectionDescription: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 4 },
  collectionMeta: { color: "#7D8AA5", fontSize: 11, fontWeight: "700", marginTop: 6 },
  chevron: { color: "#9CA9C4", fontSize: 28, lineHeight: 28 },
  settingsCard: { marginTop: 18, borderRadius: 22, padding: 17, backgroundColor: "#10182A", borderWidth: 1, borderColor: "#26314B" },
  settingsTitle: { color: "#F3F6FC", fontSize: 16, fontWeight: "800", marginBottom: 14 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingCopy: { flex: 1, paddingRight: 18 },
  settingLabel: { color: "#E3E8F4", fontSize: 14, fontWeight: "700" },
  settingDetail: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 3 },
  storageRow: { flexDirection: "row", alignItems: "center", marginTop: 17, paddingTop: 14, borderTopWidth: 1, borderColor: "#26314B" },
  storageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#63D2A3", marginRight: 8 },
  storageText: { color: "#A9B6CD", fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.7 },
});

const statsStyles = StyleSheet.create({
  dashboard: { marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderColor: "#26314B" }, heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eyebrow: { color: "#48D6E8", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 17, fontWeight: "800", marginTop: 4 }, total: { color: "#63D2A3", fontSize: 11, fontWeight: "900" }, summaryRow: { flexDirection: "row", marginTop: 14, paddingVertical: 11, borderRadius: 13, backgroundColor: "#172137" }, stat: { flex: 1, alignItems: "center" }, statValue: { color: "#F3F6FC", fontSize: 16, fontWeight: "900" }, statLabel: { color: "#8291AB", fontSize: 9, fontWeight: "800", marginTop: 3 }, sectionLabel: { color: "#71809A", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 17, marginBottom: 8 }, typeList: { gap: 8 }, typeRow: { flexDirection: "row", alignItems: "center" }, typeName: { width: 78, color: "#A9B6CD", fontSize: 10, fontWeight: "800" }, track: { flex: 1, height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: "#273652" }, fill: { height: "100%", borderRadius: 4, backgroundColor: "#7C6CFF" }, typeCount: { color: "#E5EAF5", width: 23, textAlign: "right", fontSize: 10, fontWeight: "900" }, strengthRow: { height: 90, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", paddingHorizontal: 10 }, strengthColumn: { height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 4 }, strengthTrack: { height: 55, width: 16, justifyContent: "flex-end", overflow: "hidden", borderRadius: 5, backgroundColor: "#24314B" }, strengthFill: { width: "100%", borderRadius: 5, backgroundColor: "#48D6E8" }, strengthNumber: { color: "#EDF2FB", fontSize: 10, fontWeight: "900" }, strengthLabel: { color: "#74839D", fontSize: 9, fontWeight: "800" },
});

const backupStyles = StyleSheet.create({
  section: { marginTop: 17, paddingTop: 16, borderTopWidth: 1, borderColor: "#26314B" },
  title: { color: "#E3E8F4", fontSize: 14, fontWeight: "800" },
  detail: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 4 },
  actions: { flexDirection: "row", gap: 9, marginTop: 13 },
  action: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#292560", borderWidth: 1, borderColor: "#8278F1" },
  importAction: { backgroundColor: "#172A3A", borderColor: "#3E98A8" },
  actionText: { color: "#EAE9FF", fontSize: 12, fontWeight: "900" },
  status: { color: "#7F8EA9", fontSize: 11, lineHeight: 16, marginTop: 11 },
  disabled: { opacity: 0.45 },
});
