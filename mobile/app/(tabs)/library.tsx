import { Stack, router } from "expo-router";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { ScreenContainer } from "@/components/screen-container";
import { graphCollections } from "@/lib/knowledge-data";
import { parseRelationshipBackup, serializeRelationshipBackup } from "@/lib/relationship-backup";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function LibraryScreen() {
  const [lowMotion, setLowMotion] = useState(false);
  const [backupStatus, setBackupStatus] = useState("Create a portable JSON backup before moving to another device.");
  const { connections, isReady, replaceRelationships } = useRelationshipStore();

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
      backupFile.write(serializeRelationshipBackup(connections));
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
      await Sharing.shareAsync(backupFile.uri, { dialogTitle: "Export relationship backup", mimeType: "application/json" });
      setBackupStatus(`${connections.length} relationships packaged in a JSON backup.`);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to export a backup right now.");
    }
  };

  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const backup = parseRelationshipBackup(await new File(result.assets[0].uri).text());
      Alert.alert("Restore relationship backup?", `This will replace the ${connections.length} local relationships with ${backup.connections.length} relationships from the selected backup.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", style: "destructive", onPress: () => { replaceRelationships(backup.connections); setBackupStatus(`${backup.connections.length} relationships restored from backup.`); } },
      ]);
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "Unable to read that backup file.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={graphCollections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>LOCAL LIBRARY</Text>
            <Text style={styles.title}>Your graphs</Text>
            <Text style={styles.subtitle}>Everything here is available offline on this device.</Text>
            <Pressable onPress={() => router.push("/capture")} style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
              <Text style={styles.newButtonText}>＋  Create local graph</Text>
            </Pressable>
            <Text style={styles.sectionLabel}>COLLECTIONS</Text>
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
            <Text style={styles.settingsTitle}>Research preferences</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Reduce visual motion</Text>
                <Text style={styles.settingDetail}>Keep transitions minimal while exploring.</Text>
              </View>
              <Switch value={lowMotion} onValueChange={setLowMotion} trackColor={{ false: "#33415F", true: "#7C6CFF" }} thumbColor="#F3F6FC" />
            </View>
            <View style={styles.storageRow}><View style={styles.storageDot} /><Text style={styles.storageText}>Local graph storage is healthy</Text></View>
            <View style={backupStyles.section}>
              <Text style={backupStyles.title}>Relationship backup</Text>
              <Text style={backupStyles.detail}>Export your local links and notes as JSON, then restore them on another device.</Text>
              <View style={backupStyles.actions}><Pressable disabled={!isReady} onPress={exportBackup} style={({ pressed }) => [backupStyles.action, pressed && styles.pressed, !isReady && backupStyles.disabled]}><Text style={backupStyles.actionText}>Export JSON</Text></Pressable><Pressable disabled={!isReady} onPress={importBackup} style={({ pressed }) => [backupStyles.action, backupStyles.importAction, pressed && styles.pressed, !isReady && backupStyles.disabled]}><Text style={backupStyles.actionText}>Restore JSON</Text></Pressable></View>
              <Text style={backupStyles.status}>{backupStatus}</Text>
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 116 },
  eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  title: { color: "#F3F6FC", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: "#9CA9C4", fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 310 },
  newButton: { height: 50, borderRadius: 16, backgroundColor: "#7C6CFF", alignItems: "center", justifyContent: "center", marginTop: 22, marginBottom: 27 },
  newButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  sectionLabel: { color: "#7C89A5", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
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
