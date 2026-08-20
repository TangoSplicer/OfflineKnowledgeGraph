import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { emptyLocalExportStatus, loadLocalExportStatus, type LocalExportHistoryEntry, type LocalExportStatus } from "@/lib/local-export-status";

function localTimestamp(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown time" : parsed.toLocaleString();
}

function ExportHistoryRow({ entry }: { entry: LocalExportHistoryEntry }) {
  const protectedExport = entry.format === "protected-zip";
  return <View style={styles.row}><View style={[styles.icon, protectedExport && styles.iconProtected]}><Text style={styles.iconText}>{protectedExport ? "⌁" : "↓"}</Text></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{protectedExport ? "Protected ZIP" : "Complete ZIP"}</Text><Text style={styles.rowDetail}>{entry.conceptCount} concepts · {entry.connectionCount} links</Text><Text numberOfLines={1} style={styles.filename}>{entry.filename}</Text><Text style={styles.verified}>Verified archive created · {localTimestamp(entry.exportedAt)}</Text></View></View>;
}

export default function ExportHistoryScreen() {
  const [status, setStatus] = useState<LocalExportStatus>(() => emptyLocalExportStatus());
  useFocusEffect(useCallback(() => { let active = true; void loadLocalExportStatus().then((next) => { if (active) setStatus(next); }); return () => { active = false; }; }, []));
  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable accessibilityLabel="Back to Library" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Export history</Text><View style={styles.headerSpace} /></View><Text style={styles.eyebrow}>LOCAL RECORD</Text><Text style={styles.title}>Your verified exports.</Text><Text style={styles.description}>This device keeps a short history of archive creation. It records metadata only—never a copy of the graph, a passphrase, or a shared destination.</Text><View style={styles.summary}><Text style={styles.summaryValue}>{status.history.length}</Text><View><Text style={styles.summaryTitle}>recent local exports</Text><Text style={styles.summaryDetail}>{status.lastExportedAt ? `Latest: ${localTimestamp(status.lastExportedAt)}` : "No archive has been created yet."}</Text></View></View>{status.history.length ? <View style={styles.list}>{status.history.map((entry) => <ExportHistoryRow key={entry.id} entry={entry} />)}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>No export record yet.</Text><Text style={styles.emptyDetail}>Create a complete or protected ZIP from Home. It will appear here after the archive is prepared locally.</Text><Pressable onPress={() => router.replace("/(tabs)" as never)} style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}><Text style={styles.homeButtonText}>Open Home export</Text><Text style={styles.homeButtonArrow}>→</Text></Pressable></View>}<View style={styles.note}><Text style={styles.noteTitle}>What “verified” means</Text><Text style={styles.noteText}>The app finished creating the archive on this device and recorded its filename, protection type, counts, and timestamp. The history cannot prove where a file was saved or shared afterwards.</Text></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 52 },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 26 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" },
  backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerTitle: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  headerSpace: { width: 40 },
  eyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.15, fontWeight: "900" },
  title: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", marginTop: 7 },
  description: { color: "#A8B5CB", fontSize: 13, lineHeight: 20, marginTop: 9 },
  summary: { borderRadius: 19, padding: 15, marginTop: 20, backgroundColor: "#142A38", borderWidth: 1, borderColor: "#3B7283", flexDirection: "row", alignItems: "center" },
  summaryValue: { color: "#A3F1F2", fontSize: 28, fontWeight: "900", marginRight: 13 },
  summaryTitle: { color: "#E7FBFC", fontSize: 13, fontWeight: "900" },
  summaryDetail: { color: "#9DC3CA", fontSize: 10, lineHeight: 15, marginTop: 3 },
  list: { borderRadius: 19, marginTop: 15, overflow: "hidden", backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#2E3D5D" },
  row: { minHeight: 88, paddingHorizontal: 13, paddingVertical: 12, flexDirection: "row", borderBottomWidth: 1, borderColor: "#263550" },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#1C4651", marginRight: 11 },
  iconProtected: { backgroundColor: "#302B68" },
  iconText: { color: "#A7EFF1", fontSize: 17, fontWeight: "900" },
  rowCopy: { flex: 1 },
  rowTitle: { color: "#EDF4FB", fontSize: 13, fontWeight: "900" },
  rowDetail: { color: "#A2B8C8", fontSize: 10, marginTop: 3 },
  filename: { color: "#7BD9E1", fontSize: 10, marginTop: 5, fontWeight: "800" },
  verified: { color: "#8496B2", fontSize: 9, marginTop: 4 },
  empty: { borderRadius: 19, padding: 16, marginTop: 15, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#2E3D5D" },
  emptyTitle: { color: "#EDF4FB", fontSize: 15, fontWeight: "900" },
  emptyDetail: { color: "#9BAAC1", fontSize: 12, lineHeight: 18, marginTop: 6 },
  homeButton: { minHeight: 42, borderRadius: 11, paddingHorizontal: 13, marginTop: 14, backgroundColor: "#2E6571", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  homeButtonText: { color: "#E6FFFF", fontSize: 11, fontWeight: "900" },
  homeButtonArrow: { color: "#C1F4F5", fontSize: 18 },
  note: { borderRadius: 17, padding: 14, marginTop: 16, backgroundColor: "#181C39", borderWidth: 1, borderColor: "#3B4177" },
  noteTitle: { color: "#D8D6FF", fontSize: 11, fontWeight: "900" },
  noteText: { color: "#A8B0D0", fontSize: 10, lineHeight: 16, marginTop: 5 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
