import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

import { createBackupPreview } from "@/lib/backup-preview";
import { mergeSelectedGraphImport, selectBackupGraph } from "@/lib/selective-import";
import { parseGraphBackup, type GraphBackup } from "@/lib/relationship-backup";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function RestoreBackupScreen() {
  const { concepts, connections, isReady, replaceGraph } = useRelationshipStore();
  const [pendingBackup, setPendingBackup] = useState<GraphBackup | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const selectedGraph = useMemo(() => pendingBackup ? selectBackupGraph(pendingBackup, selectedIds) : null, [pendingBackup, selectedIds]);
  const preview = selectedGraph && pendingBackup ? createBackupPreview({ ...pendingBackup, ...selectedGraph }) : null;

  const chooseBackup = async () => {
    if (!isReady) return;
    if (Platform.OS === "web") { setError("Selective restore is available in the installed Android app."); return; }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const backup = parseGraphBackup(await new File(result.assets[0].uri).text());
      setPendingBackup(backup);
      setSelectedIds(new Set(backup.concepts.map((concept) => concept.id)));
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to read that backup file."); }
  };

  const toggleConcept = (id: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const importSelected = () => {
    if (!pendingBackup || !selectedIds.size) return;
    const merged = mergeSelectedGraphImport(concepts, connections, pendingBackup, selectedIds);
    replaceGraph(merged.concepts, merged.connections);
    router.replace("/(tabs)");
  };

  return <View style={styles.screen}><Stack.Screen options={{ headerShown: false }} /><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Import backup</Text><View style={styles.headerSpace} /></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{pendingBackup && preview ? <SelectionPreview backup={pendingBackup} preview={preview} selectedIds={selectedIds} onToggle={toggleConcept} onChooseAnother={() => setPendingBackup(null)} /> : <Landing onChoose={chooseBackup} disabled={!isReady} />}{error ? <Text style={styles.error}>{error}</Text> : null}</ScrollView>{pendingBackup && preview ? <View style={styles.footer}><Text style={styles.footerNote}>Only selected concepts and links between them will be added. Your current graph stays intact.</Text><Pressable disabled={!selectedIds.size} onPress={importSelected} style={({ pressed }) => [styles.primary, pressed && styles.pressed, !selectedIds.size && styles.disabled]}><Text style={styles.primaryText}>Import {preview.conceptCount} concepts</Text><Text style={styles.arrow}>→</Text></Pressable></View> : null}</View>;
}

function Landing({ onChoose, disabled }: { onChoose: () => void; disabled: boolean }) { return <View><View style={styles.iconWrap}><Text style={styles.icon}>↥</Text></View><Text style={styles.eyebrow}>BRING YOUR GRAPH WITH YOU</Text><Text style={styles.title}>Import only what you need.</Text><Text style={styles.description}>Choose a complete JSON backup, inspect its concepts, and select the ideas you want to merge into this local workspace.</Text><View style={styles.detailCard}><Detail label="Concepts" value="Choose" /><Detail label="Links" value="Matched" /><Detail label="Notes" value="Kept" /></View><Pressable disabled={disabled} onPress={onChoose} style={({ pressed }) => [styles.primary, pressed && styles.pressed, disabled && styles.disabled]}><Text style={styles.primaryText}>Choose JSON backup</Text><Text style={styles.arrow}>→</Text></Pressable><Pressable onPress={() => router.replace("/first-concept-wizard")} style={({ pressed }) => [styles.startFresh, pressed && styles.pressed]}><Text style={styles.startFreshText}>Start fresh instead</Text></Pressable></View>; }

function SelectionPreview({ backup, preview, selectedIds, onToggle, onChooseAnother }: { backup: GraphBackup; preview: ReturnType<typeof createBackupPreview>; selectedIds: Set<string>; onToggle: (id: string) => void; onChooseAnother: () => void }) { return <View><Text style={styles.eyebrow}>SELECTIVE IMPORT</Text><Text style={styles.title}>Choose what to bring in.</Text><Text style={styles.description}>Relationship links are included only when both of their concepts are selected.</Text><View style={styles.previewCard}><View><Text style={styles.previewEyebrow}>BACKUP READY</Text><Text style={styles.previewDate}>Exported {new Date(preview.exportedAt).toLocaleDateString()}</Text></View><View style={styles.previewMetrics}><Detail label="Concepts" value={`${preview.conceptCount}`} /><Detail label="Links" value={`${preview.relationshipCount}`} /><Detail label="Notes" value={`${preview.notedRelationshipCount}`} /></View><Text style={styles.previewKinds}>Kinds: {preview.conceptKinds.join(", ") || "None"}</Text></View><View style={styles.selectAllRow}><Text style={styles.selectLabel}>CONCEPTS IN THIS BACKUP</Text><Pressable onPress={() => backup.concepts.forEach((concept) => { if (!selectedIds.has(concept.id)) onToggle(concept.id); })}><Text style={styles.selectAllText}>Select all</Text></Pressable></View><View style={styles.conceptList}>{backup.concepts.map((concept) => { const selected = selectedIds.has(concept.id); const relatedCount = backup.connections.filter((connection) => connection.sourceId === concept.id || connection.targetId === concept.id).length; return <Pressable key={concept.id} onPress={() => onToggle(concept.id)} style={({ pressed }) => [styles.conceptRow, selected && styles.conceptRowSelected, pressed && styles.pressed]}><View style={[styles.conceptMark, { backgroundColor: concept.color }]} /><View style={styles.conceptCopy}><Text style={styles.conceptTitle}>{concept.title}</Text><Text style={styles.conceptMeta}>{concept.kind} · {relatedCount} backup link{relatedCount === 1 ? "" : "s"}</Text></View><View style={[styles.check, selected && styles.checkSelected]}><Text style={styles.checkText}>{selected ? "✓" : ""}</Text></View></Pressable>; })}</View><Pressable onPress={onChooseAnother} style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}><Text style={styles.changeText}>Choose another backup</Text></Pressable></View>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailValue}>{value}</Text><Text style={styles.detailLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 }, header: { height: 52, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" }, backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 }, headerTitle: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" }, headerSpace: { width: 40 }, content: { paddingHorizontal: 24, paddingTop: 38, paddingBottom: 28 }, iconWrap: { width: 62, height: 62, borderRadius: 21, backgroundColor: "#1E4851", alignItems: "center", justifyContent: "center", marginBottom: 22 }, icon: { color: "#75E0E9", fontSize: 31, fontWeight: "700" }, eyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.2, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", marginTop: 8 }, description: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 10 }, detailCard: { flexDirection: "row", borderRadius: 18, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2C3A59", paddingVertical: 15, marginTop: 25 }, detail: { flex: 1, alignItems: "center" }, detailValue: { color: "#63D2A3", fontSize: 12, fontWeight: "900" }, detailLabel: { color: "#8492AB", fontSize: 10, fontWeight: "800", marginTop: 4 }, previewCard: { borderRadius: 19, marginTop: 21, padding: 15, backgroundColor: "#14263A", borderWidth: 1, borderColor: "#3B6C83" }, previewEyebrow: { color: "#7FE1E9", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, previewDate: { color: "#E5F3FA", fontSize: 13, fontWeight: "800", marginTop: 6 }, previewMetrics: { flexDirection: "row", marginTop: 13, paddingVertical: 11, borderRadius: 12, backgroundColor: "#112033" }, previewKinds: { color: "#A9C7D8", fontSize: 11, lineHeight: 16, marginTop: 11 }, selectAllRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 9 }, selectLabel: { color: "#71809A", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, selectAllText: { color: "#AFA8FF", fontSize: 11, fontWeight: "900" }, conceptList: { gap: 8 }, conceptRow: { minHeight: 60, borderRadius: 14, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2D3D5C", paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }, conceptRowSelected: { backgroundColor: "#1C3250", borderColor: "#56819B" }, conceptMark: { width: 10, height: 34, borderRadius: 5, marginRight: 11 }, conceptCopy: { flex: 1 }, conceptTitle: { color: "#E8EDF8", fontSize: 13, fontWeight: "900" }, conceptMeta: { color: "#91A0B9", fontSize: 10, marginTop: 3 }, check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: "#53647E", alignItems: "center", justifyContent: "center", marginLeft: 10 }, checkSelected: { backgroundColor: "#4B69A1", borderColor: "#8CC8E2" }, checkText: { color: "#EAF8FF", fontSize: 13, fontWeight: "900" }, changeButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 13 }, changeText: { color: "#B9B2FF", fontSize: 12, fontWeight: "800" }, footer: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 30, borderTopWidth: 1, borderColor: "#202B44", backgroundColor: "#0B1020" }, footerNote: { color: "#8494AD", fontSize: 10, lineHeight: 15, marginBottom: 9 }, primary: { minHeight: 53, borderRadius: 16, backgroundColor: "#7C6CFF", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, arrow: { color: "#FFFFFF", fontSize: 21 }, startFresh: { minHeight: 48, justifyContent: "center", alignItems: "center" }, startFreshText: { color: "#B9B2FF", fontSize: 13, fontWeight: "800" }, error: { color: "#FF9EAE", fontSize: 12, lineHeight: 18, marginHorizontal: 24, marginBottom: 16 }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
