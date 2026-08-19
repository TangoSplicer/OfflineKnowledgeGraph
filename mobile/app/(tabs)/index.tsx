import { Stack, router , useFocusEffect } from "expo-router";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCallback, useState } from "react";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { GraphCanvas } from "@/components/graph-canvas";
import { ScreenContainer } from "@/components/screen-container";
import { SyncProgressPanel } from "@/components/sync-progress-panel";
import { reviewCues } from "@/lib/knowledge-data";
import { formatActivityTime } from "@/lib/activity-history";
import { useRelationshipStore } from "@/lib/relationship-store";
import { loadBackupSchedules, runEncryptedBackupNow } from "@/lib/backup-runner";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { biometricPromptFor } from "@/lib/biometric-gate-state";
import { summarizeBackupSchedules, type BackupStatusSummary } from "@/lib/backup-status";
import { syncProgress, type SyncProgressState } from "@/lib/sync-progress";
import { buildHomeLocalExportBundle, buildPasswordProtectedExportBundle, exportPassphraseStrength, homeLocalExportBundleFilename, homeLocalExportFilename, homeLocalExportMessage, homeLocalGraphImageFilename, homeProtectedExportBundleFilename, validateExportPassphrase, type HomeLocalExportState } from "@/lib/home-local-export";
import { serializeGraphBackup } from "@/lib/relationship-backup";
import { buildGraphSvg } from "@/lib/graph-export";
import { emptyLocalExportStatus, loadLocalExportStatus, localExportStatusLabel, persistLocalExport, saveLocalExportStatus, shouldShowLocalExportReminder, type LocalExportStatus } from "@/lib/local-export-status";

export default function TodayScreen() {
  const { concepts, connections, allConcepts, allConnections, activity, isReady, loadDemoGraph } = useRelationshipStore();
  const [backupSummary, setBackupSummary] = useState<BackupStatusSummary | null>(null);
  const [quickRunState, setQuickRunState] = useState<"idle" | "running">("idle");
  const [quickRunMessage, setQuickRunMessage] = useState("");
  const [quickRunProgress, setQuickRunProgress] = useState<SyncProgressState>(() => syncProgress("idle"));
  const [exportState, setExportState] = useState<HomeLocalExportState>("idle");
  const [exportMessage, setExportMessage] = useState(() => homeLocalExportMessage("idle", 0, 0));
  const [exportStatus, setExportStatus] = useState<LocalExportStatus>(() => emptyLocalExportStatus());
  const [isProtectedExport, setIsProtectedExport] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportPassphraseConfirmation, setExportPassphraseConfirmation] = useState("");
  const hasConcepts = concepts.length > 0;
  const refreshBackupSummary = useCallback(async () => { const schedules = await loadBackupSchedules(); setBackupSummary(summarizeBackupSchedules(schedules)); }, []);
  useFocusEffect(useCallback(() => { let active = true; void Promise.all([loadBackupSchedules(), loadLocalExportStatus()]).then(([schedules, status]) => { if (active) { setBackupSummary(summarizeBackupSchedules(schedules)); setExportStatus(status); } }); return () => { active = false; }; }, []));
  const runQuickBackup = useCallback(async () => {
    if (quickRunState === "running") return;
    setQuickRunProgress(syncProgress("authorizing"));
    const gate = await confirmSensitiveSyncAction("Run an encrypted backup now");
    if (!gate.allowed) { setQuickRunProgress(syncProgress("error", gate.message)); setQuickRunMessage(gate.message); return; }
    setQuickRunState("running"); setQuickRunMessage("");
    try {
      const result = await runEncryptedBackupNow(undefined, new Date(), setQuickRunProgress);
      setBackupSummary(summarizeBackupSchedules(result.schedules));
      setQuickRunMessage(result.messages[0] ?? "Encrypted backup check complete.");
    } catch (error) { const message = error instanceof Error ? error.message : "Encrypted backup quick run failed."; setQuickRunProgress(syncProgress("error", message)); setQuickRunMessage(message); }
    finally { setQuickRunState("idle"); }
  }, [quickRunState]);
  const exportLocalGraph = useCallback(async () => {
    if (exportState === "exporting") return;
    if (isProtectedExport) {
      const validation = validateExportPassphrase(exportPassphrase, exportPassphraseConfirmation);
      if (!validation.valid) { setExportState("error"); setExportMessage(validation.message); return; }
      const gate = await confirmSensitiveSyncAction(biometricPromptFor("protected-export"));
      if (!gate.allowed) { setExportState("error"); setExportMessage(gate.message); return; }
    }
    setExportState("exporting");
    setExportMessage(homeLocalExportMessage("exporting", allConcepts.length, allConnections.length));
    try {
      const exportedAt = new Date();
      const filename = homeLocalExportFilename(exportedAt);
      const imageFilename = homeLocalGraphImageFilename(exportedAt);
      const bundleFilename = isProtectedExport ? homeProtectedExportBundleFilename(exportedAt) : homeLocalExportBundleFilename(exportedAt);
      const serialized = serializeGraphBackup(allConcepts, allConnections);
      const graphImage = buildGraphSvg(allConcepts, allConnections, { subtitle: `${allConcepts.length} concepts · ${allConnections.length} relationships · Complete local export` });
      const plainBundle = buildHomeLocalExportBundle(filename, serialized, imageFilename, graphImage);
      const bundle = isProtectedExport ? await buildPasswordProtectedExportBundle(plainBundle, homeLocalExportBundleFilename(exportedAt), exportPassphrase) : plainBundle;
      if (Platform.OS === "web") {
        const blob = new Blob([bundle as unknown as BlobPart], { type: "application/zip" });
        const objectUrl = URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.href = objectUrl;
        download.download = bundleFilename;
        download.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        const exportFile = new File(Paths.cache, bundleFilename);
        exportFile.create({ overwrite: true, intermediates: true });
        exportFile.write(bundle);
        if (!(await Sharing.isAvailableAsync())) throw new Error("File sharing is unavailable on this device.");
        await Sharing.shareAsync(exportFile.uri, { dialogTitle: "Save local graph backup", mimeType: "application/zip" });
      }
      setExportStatus(await persistLocalExport());
      setExportPassphrase("");
      setExportPassphraseConfirmation("");
      setExportState("complete");
      setExportMessage(homeLocalExportMessage("complete", allConcepts.length, allConnections.length));
    } catch (error) {
      setExportState("error");
      setExportMessage(error instanceof Error ? error.message : homeLocalExportMessage("error", allConcepts.length, allConnections.length));
    }
  }, [allConcepts, allConnections, exportPassphrase, exportPassphraseConfirmation, exportState, isProtectedExport]);
  const toggleExportReminders = useCallback(() => {
    setExportStatus((current) => {
      const next = { ...current, remindersEnabled: !current.remindersEnabled };
      void saveLocalExportStatus(next);
      return next;
    });
  }, []);
  const toggleExportProtection = useCallback(() => {
    setIsProtectedExport((current) => {
      const next = !current;
      if (!next) { setExportPassphrase(""); setExportPassphraseConfirmation(""); }
      return next;
    });
  }, []);
  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={hasConcepts ? activity : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          hasConcepts ? <PopulatedDashboard concepts={concepts.length} relationships={connections.length} backupSummary={backupSummary} onQuickRun={runQuickBackup} quickRunState={quickRunState} quickRunMessage={quickRunMessage} quickRunProgress={quickRunProgress} onExport={exportLocalGraph} exportState={exportState} exportMessage={exportMessage} exportStatus={exportStatus} onToggleExportReminders={toggleExportReminders} isProtectedExport={isProtectedExport} exportPassphrase={exportPassphrase} exportPassphraseConfirmation={exportPassphraseConfirmation} onToggleExportProtection={toggleExportProtection} onChangeExportPassphrase={setExportPassphrase} onChangeExportPassphraseConfirmation={setExportPassphraseConfirmation} /> : <EmptyWorkspaceWelcome isReady={isReady} onCreate={() => router.push("/first-concept-wizard")} onRestore={() => router.push("/restore-backup")} onLoadDemo={() => loadDemoGraph()} />
        }
        renderItem={({ item }) => <View style={styles.activityRow}><View style={[styles.activityMark, { backgroundColor: item.color }]} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activityDetail}>{item.detail}</Text></View><Text style={styles.activityTime}>{formatActivityTime(item.createdAt)}</Text></View>}
        ListEmptyComponent={hasConcepts ? <View style={styles.activityEmpty}><Text style={styles.activityEmptyText}>Your next concept or relationship change will appear here.</Text></View> : null}
        ListFooterComponent={hasConcepts ? <View style={styles.footerSpace} /> : null}
      />
      {hasConcepts ? <Pressable onPress={() => router.push("/capture")} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}><Text style={styles.fabText}>＋</Text><Text style={styles.fabLabel}>New concept</Text></Pressable> : null}
    </ScreenContainer>
  );
}

function EmptyWorkspaceWelcome({ isReady, onCreate, onRestore, onLoadDemo }: { isReady: boolean; onCreate: () => void; onRestore: () => void; onLoadDemo: () => void }) {
  return <View style={styles.emptyContent}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>OFFLINE KNOWLEDGE GRAPH</Text><Text style={styles.greeting}>Start with one idea.</Text></View><Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.search, pressed && styles.pressed]}><Text style={styles.searchText}>⌕</Text></Pressable></View>
    <View style={styles.welcomeCard}><KnowledgeMapMark /><Text style={styles.welcomeEyebrow}>A CLEAR PLACE TO BEGIN</Text><Text style={styles.welcomeTitle}>Your workspace is empty.</Text><Text style={styles.welcomeText}>{isReady ? "Capture one concept, then add the connections that make it useful. Nothing is preloaded into your personal graph." : "Preparing your local workspace…"}</Text><Pressable disabled={!isReady} onPress={onCreate} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.primaryButtonText}>Create your first concept</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable><Pressable disabled={!isReady} onPress={onRestore} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.restoreButtonText}>I have a backup</Text><Text style={styles.restoreArrow}>Restore JSON</Text></Pressable><Pressable disabled={!isReady} onPress={onLoadDemo} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.demoButtonText}>Load demo graph</Text></Pressable></View>
    <View style={styles.startSteps}><Text style={styles.stepsTitle}>A simple starting path</Text><Step number="1" title="Capture an idea" detail="Give it a name and a short working note." /><Step number="2" title="Connect it" detail="Add relationships only when they help you think." /><Step number="3" title="Build from there" detail="Your graph grows with your own research." /></View><View style={styles.protectionGuide}><Text style={styles.protectionEyebrow}>KEEP IT YOURS</Text><Text style={styles.protectionTitle}>Local control, from the start.</Text><Text style={styles.protectionText}>Export a JSON backup, schedule protected local snapshots, or transfer selected bundles nearby. No account is required.</Text><Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [styles.protectionButton, pressed && styles.pressed]}><Text style={styles.protectionButtonText}>Open local tools</Text><Text style={styles.protectionArrow}>→</Text></Pressable></View>
  </View>;
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) { return <View style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepDetail}>{detail}</Text></View></View>; }

function KnowledgeMapMark() { return <View accessibilityLabel="Local knowledge map" style={styles.welcomeMap}><View style={[styles.mapLink, styles.mapLinkOne]} /><View style={[styles.mapLink, styles.mapLinkTwo]} /><View style={[styles.mapNode, styles.mapNodeOne]} /><View style={[styles.mapNode, styles.mapNodeTwo]} /><View style={[styles.mapNode, styles.mapNodeThree]} /></View>; }

function PopulatedDashboard({ concepts, relationships, backupSummary, onQuickRun, quickRunState, quickRunMessage, quickRunProgress, onExport, exportState, exportMessage, exportStatus, onToggleExportReminders, isProtectedExport, exportPassphrase, exportPassphraseConfirmation, onToggleExportProtection, onChangeExportPassphrase, onChangeExportPassphraseConfirmation }: { concepts: number; relationships: number; backupSummary: BackupStatusSummary | null; onQuickRun: () => void; quickRunState: "idle" | "running"; quickRunMessage: string; quickRunProgress: SyncProgressState; onExport: () => void; exportState: HomeLocalExportState; exportMessage: string; exportStatus: LocalExportStatus; onToggleExportReminders: () => void; isProtectedExport: boolean; exportPassphrase: string; exportPassphraseConfirmation: string; onToggleExportProtection: () => void; onChangeExportPassphrase: (value: string) => void; onChangeExportPassphraseConfirmation: (value: string) => void }) {
  const showReminder = shouldShowLocalExportReminder(exportStatus);
  const passphraseFeedback = exportPassphraseStrength(exportPassphrase);
  return <View>
    <View style={styles.header}><View><Text style={styles.eyebrow}>OFFLINE KNOWLEDGE GRAPH</Text><Text style={styles.greeting}>Make sense of what you know.</Text></View><Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.search, pressed && styles.pressed]}><Text style={styles.searchText}>⌕</Text></Pressable></View>
    <Pressable onPress={() => router.push("/(tabs)/explore")} style={({ pressed }) => [styles.graphCard, pressed && styles.pressed]}><View style={styles.graphCardTop}><View><Text style={styles.graphLabel}>ACTIVE GRAPH</Text><Text style={styles.graphName}>Your workspace</Text></View><Text style={styles.exploreLink}>Explore →</Text></View><GraphCanvas compact onSelect={(id) => router.push(`/concept/${id}`)} /><View style={styles.graphFooter}><View><Text style={styles.graphStat}>{concepts}</Text><Text style={styles.graphStatLabel}>concepts</Text></View><View style={styles.footerDivider} /><View><Text style={styles.graphStat}>{relationships}</Text><Text style={styles.graphStatLabel}>relationships</Text></View><View style={styles.footerDivider} /><View style={styles.localRow}><View style={styles.localDot} /><Text style={styles.localText}>Local-first</Text></View></View></Pressable>
    {showReminder ? <View style={styles.exportReminder}><View style={styles.exportReminderCopy}><Text style={styles.exportReminderTitle}>Your graph has changed</Text><Text style={styles.exportReminderText}>You have made {exportStatus.editsSinceLastExport} local edits since your last export.</Text></View><Pressable onPress={onExport} style={({ pressed }) => [styles.exportReminderButton, pressed && styles.pressed]}><Text style={styles.exportReminderButtonText}>Export now</Text></Pressable></View> : null}
    <View style={styles.localExportCard}><View style={styles.localExportCopy}><Text style={styles.localExportEyebrow}>{isProtectedExport ? "PROTECTED LOCAL EXPORT" : "COMPLETE LOCAL EXPORT"}</Text><Text style={styles.localExportTitle}>{isProtectedExport ? "Encrypt your graph and map" : "Save your graph and its map"}</Text><Text accessibilityLiveRegion="polite" style={styles.localExportDetail}>{exportMessage}</Text><Text style={styles.localExportStatus}>{localExportStatusLabel(exportStatus)}</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: isProtectedExport }} onPress={onToggleExportProtection} style={({ pressed }) => [styles.protectionToggle, pressed && styles.pressed]}><Text style={styles.protectionToggleText}>Passphrase protection</Text><Text style={styles.protectionToggleValue}>{isProtectedExport ? "On" : "Off"}</Text></Pressable>{isProtectedExport ? <View style={styles.passphrasePanel}><TextInput value={exportPassphrase} onChangeText={onChangeExportPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Create passphrase (12+ characters)" placeholderTextColor="#718A96" accessibilityLabel="Export passphrase" style={styles.passphraseInput} /><Text accessibilityLiveRegion="polite" style={styles.passphraseStrength}>Passphrase strength: {passphraseFeedback.label}. {passphraseFeedback.detail}</Text><TextInput value={exportPassphraseConfirmation} onChangeText={onChangeExportPassphraseConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Confirm passphrase" placeholderTextColor="#718A96" accessibilityLabel="Confirm export passphrase" style={styles.passphraseInput} /><Text style={styles.passphraseGuidance}>The passphrase stays on this device only. A device confirmation is required before sharing. It cannot be recovered.</Text></View> : null}<Pressable accessibilityRole="button" accessibilityLabel={isProtectedExport ? "Export passphrase-protected local graph ZIP" : "Export complete local graph as a ZIP file"} disabled={exportState === "exporting"} onPress={onExport} style={({ pressed }) => [styles.localExportButton, pressed && styles.pressed, exportState === "exporting" && styles.disabled]}><Text style={styles.localExportButtonText}>{exportState === "exporting" ? "Preparing…" : isProtectedExport ? "Export protected ZIP" : "Export ZIP"}</Text><Text style={styles.localExportArrow}>↓</Text></Pressable><Pressable onPress={onToggleExportReminders} style={({ pressed }) => [styles.exportReminderToggle, pressed && styles.pressed]}><Text style={styles.exportReminderToggleText}>Export reminders: {exportStatus.remindersEnabled ? "On" : "Off"}</Text><Text style={styles.exportReminderToggleHint}>after 5 edits</Text></Pressable></View>
    {backupSummary ? <View style={styles.backupCard}><Pressable onPress={() => router.push("/backup-schedules" as never)} style={({ pressed }) => [styles.backupMain, pressed && styles.pressed]}><View style={[styles.backupDot, { backgroundColor: backupSummary.attention ? "#F2A0A8" : backupSummary.activeCount ? "#63D2A3" : "#8A98B4" }]} /><View style={styles.backupCopy}><Text style={styles.backupTitle}>Encrypted backups</Text><Text style={styles.backupDetail}>{backupSummary.configuredCount ? `${backupSummary.activeCount} active · ${backupSummary.nextRunLabel}` : "Set up a protected schedule for automatic encrypted snapshots."}</Text>{backupSummary.attentionLabel ? <Text style={styles.backupAttention}>{backupSummary.attentionLabel}</Text> : null}</View><Text style={styles.backupArrow}>›</Text></Pressable><View style={styles.backupActions}><Pressable onPress={onQuickRun} disabled={quickRunState === "running"} style={({ pressed }) => [styles.backupAction, pressed && styles.pressed, quickRunState === "running" && styles.disabled]}><Text style={styles.backupActionText}>{quickRunState === "running" ? "Syncing encrypted backup…" : "Run encrypted backup now"}</Text></Pressable></View><SyncProgressPanel progress={quickRunProgress} />{quickRunMessage ? <Text style={styles.quickRunMessage}>{quickRunMessage}</Text> : null}</View> : null}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>A gentle nudge</Text><Text style={styles.sectionHint}>for your graph</Text></View><View style={styles.cueCard}><View style={[styles.cueStripe, { backgroundColor: reviewCues[0].tint }]} /><View style={styles.cueCopy}><Text style={styles.cueTitle}>{reviewCues[0].label}</Text><Text style={styles.cueDetail}>{reviewCues[0].detail}</Text></View><Text style={styles.cueArrow}>›</Text></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent activity</Text><Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.allLink}>Library</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 88 },
  emptyContent: { paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 23 },
  eyebrow: { color: "#48D6E8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  greeting: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7, maxWidth: 270 },
  search: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", alignItems: "center", justifyContent: "center", marginTop: 2 },
  searchText: { color: "#F3F6FC", fontSize: 28, lineHeight: 28, marginTop: -5 },
  welcomeCard: { borderRadius: 26, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#394677", padding: 21 },
  welcomeMap: { width: 58, height: 58, borderRadius: 20, backgroundColor: "#182D42", marginBottom: 20, position: "relative" },
  mapLink: { position: "absolute", height: 2, borderRadius: 1, backgroundColor: "#75DEE4", transformOrigin: "left center" },
  mapLinkOne: { width: 25, left: 18, top: 21, transform: [{ rotate: "-38deg" }] },
  mapLinkTwo: { width: 24, left: 17, top: 28, transform: [{ rotate: "32deg" }] },
  mapNode: { position: "absolute", width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#0B1627" },
  mapNodeOne: { left: 11, top: 24, backgroundColor: "#78E2E3" },
  mapNodeTwo: { left: 35, top: 9, backgroundColor: "#8C80FF" },
  mapNodeThree: { left: 35, top: 37, backgroundColor: "#C5F1F1" },
  welcomeEyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" },
  welcomeTitle: { color: "#F3F6FC", fontSize: 25, lineHeight: 31, fontWeight: "800", marginTop: 7 },
  welcomeText: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 9 },
  primaryButton: { minHeight: 51, borderRadius: 14, backgroundColor: "#7C6CFF", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 21 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  primaryButtonArrow: { color: "#FFFFFF", fontSize: 21 },
  restoreButton: { minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: "#3D7390", backgroundColor: "#152C3E", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9 },
  restoreButtonText: { color: "#BFEAF0", fontSize: 12, fontWeight: "900" },
  restoreArrow: { color: "#77D9E6", fontSize: 10, fontWeight: "900" },
  demoButton: { minHeight: 45, alignItems: "center", justifyContent: "center", marginTop: 6 },
  demoButtonText: { color: "#B9B2FF", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  startSteps: { paddingTop: 29 },
  protectionGuide: { marginTop: 22, borderRadius: 18, padding: 15, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" },
  protectionEyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  protectionTitle: { color: "#E9F5FA", fontSize: 15, lineHeight: 20, fontWeight: "900", marginTop: 6 },
  protectionText: { color: "#9BB2C4", fontSize: 11, lineHeight: 16, marginTop: 5 },
  protectionButton: { minHeight: 37, borderRadius: 10, marginTop: 10, paddingHorizontal: 11, backgroundColor: "#1C4656", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protectionButtonText: { color: "#D9F7F8", fontSize: 10, fontWeight: "900" },
  protectionArrow: { color: "#A9EBEF", fontSize: 16 },
  stepsTitle: { color: "#F3F6FC", fontSize: 17, fontWeight: "800", marginBottom: 11 },
  step: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#202B44" },
  stepNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#344666", justifyContent: "center", alignItems: "center", marginRight: 12 },
  stepNumberText: { color: "#A9A0FF", fontSize: 12, fontWeight: "900" },
  stepTitle: { color: "#E7ECF7", fontSize: 13, fontWeight: "800" },
  stepDetail: { color: "#8795AE", fontSize: 11, marginTop: 3 },
  graphCard: { borderRadius: 26, overflow: "hidden", backgroundColor: "#11192B", borderWidth: 1, borderColor: "#26314B" },
  graphCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 17, paddingBottom: 12 },
  graphLabel: { color: "#8A98B4", fontSize: 10, letterSpacing: 1.1, fontWeight: "900", marginBottom: 4 },
  graphName: { color: "#F3F6FC", fontSize: 17, fontWeight: "800" },
  exploreLink: { color: "#A9A0FF", fontSize: 13, fontWeight: "800" },
  graphFooter: { height: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, justifyContent: "space-between" },
  graphStat: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  graphStatLabel: { color: "#8693AD", fontSize: 10, fontWeight: "600", marginTop: 2 },
  footerDivider: { width: 1, height: 26, backgroundColor: "#293551" },
  localRow: { flexDirection: "row", alignItems: "center" },
  localDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#63D2A3", marginRight: 6 },
  localText: { color: "#B9C8DD", fontSize: 11, fontWeight: "700" },
  localExportCard: { marginTop: 14, borderRadius: 18, padding: 14, backgroundColor: "#15333D", borderWidth: 1, borderColor: "#39788A" },
  localExportCopy: { flex: 1 },
  localExportEyebrow: { color: "#7DE5E5", fontSize: 9, letterSpacing: 1.05, fontWeight: "900" },
  localExportTitle: { color: "#E5FAFB", fontSize: 15, fontWeight: "900", marginTop: 5 },
  localExportDetail: { color: "#A8CDD3", fontSize: 11, lineHeight: 16, marginTop: 4 },
  localExportStatus: { color: "#74DBE1", fontSize: 10, fontWeight: "800", marginTop: 8 },
  protectionToggle: { minHeight: 37, borderRadius: 10, paddingHorizontal: 11, marginTop: 11, backgroundColor: "#193F48", borderWidth: 1, borderColor: "#4B8B94", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protectionToggleText: { color: "#D3F0F2", fontSize: 11, fontWeight: "900" },
  protectionToggleValue: { color: "#83E5E9", fontSize: 10, fontWeight: "900" },
  passphrasePanel: { marginTop: 9, gap: 8 },
  passphraseInput: { minHeight: 40, borderRadius: 10, paddingHorizontal: 11, color: "#EEFDFE", backgroundColor: "#0E2530", borderWidth: 1, borderColor: "#3C737F", fontSize: 12 },
  passphraseStrength: { color: "#8CE4E7", fontSize: 10, lineHeight: 14 },
  passphraseGuidance: { color: "#9BC6CA", fontSize: 10, lineHeight: 14, marginTop: 1 },
  localExportButton: { minHeight: 42, borderRadius: 11, backgroundColor: "#3A8F99", paddingHorizontal: 13, marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  localExportButtonText: { color: "#F1FEFE", fontSize: 12, fontWeight: "900" },
  localExportArrow: { color: "#F1FEFE", fontSize: 18, fontWeight: "900" },
  exportReminderToggle: { minHeight: 31, paddingHorizontal: 2, marginTop: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exportReminderToggleText: { color: "#BFE6E7", fontSize: 10, fontWeight: "800" },
  exportReminderToggleHint: { color: "#88AEB6", fontSize: 9 },
  exportReminder: { minHeight: 68, borderRadius: 16, marginTop: 14, padding: 12, backgroundColor: "#25284A", borderWidth: 1, borderColor: "#6F69BE", flexDirection: "row", alignItems: "center" },
  exportReminderCopy: { flex: 1, paddingRight: 10 },
  exportReminderTitle: { color: "#F0EEFF", fontSize: 13, fontWeight: "900" },
  exportReminderText: { color: "#B7B4D9", fontSize: 10, lineHeight: 14, marginTop: 3 },
  exportReminderButton: { minHeight: 33, borderRadius: 9, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#625AB5" },
  exportReminderButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 27, marginBottom: 11 },
  sectionTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  sectionHint: { color: "#7D8AA5", fontSize: 12 },
  allLink: { color: "#A9A0FF", fontSize: 13, fontWeight: "800" },
  backupCard: { borderRadius: 18, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75", marginTop: 16, padding: 12 },
  backupMain: { minHeight: 58, flexDirection: "row", alignItems: "center" },
  backupActions: { marginTop: 8 },
  backupAction: { minHeight: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#245466" },
  backupActionText: { color: "#D9F7F8", fontSize: 10, fontWeight: "900" },
  quickRunMessage: { color: "#9FB9C8", fontSize: 9, lineHeight: 14, marginTop: 7 },
  backupDot: { width: 10, height: 10, borderRadius: 5, marginRight: 11 },
  backupCopy: { flex: 1 },
  backupTitle: { color: "#E9F5FA", fontSize: 13, fontWeight: "800" },
  backupDetail: { color: "#98B3C7", fontSize: 10, lineHeight: 15, marginTop: 3 },
  backupAttention: { color: "#F0B8C1", fontSize: 9, lineHeight: 13, marginTop: 2 },
  backupArrow: { color: "#A8DDE3", fontSize: 25, marginLeft: 10 },
  cueCard: { minHeight: 76, borderRadius: 19, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", flexDirection: "row", alignItems: "center", overflow: "hidden" },
  cueStripe: { width: 4, alignSelf: "stretch" },
  cueCopy: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  cueTitle: { color: "#E9EDF7", fontSize: 14, fontWeight: "800" },
  cueDetail: { color: "#94A1BA", fontSize: 12, marginTop: 4 },
  cueArrow: { color: "#A5B0C7", fontSize: 27, marginRight: 16 },
  activityRow: { minHeight: 67, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#202B44" },
  activityMark: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  activityCopy: { flex: 1 },
  activityTitle: { color: "#E8EDF8", fontSize: 14, fontWeight: "700" },
  activityDetail: { color: "#8794AE", fontSize: 12, marginTop: 3 },
  activityTime: { color: "#71809D", fontSize: 11, fontWeight: "700" },
  activityEmpty: { minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: "#293854", backgroundColor: "#121B2E", padding: 13, justifyContent: "center" },
  activityEmptyText: { color: "#8291AB", fontSize: 12, lineHeight: 17 },
  footerSpace: { height: 38 },
  fab: { position: "absolute", right: 20, bottom: 18, height: 50, borderRadius: 25, backgroundColor: "#7C6CFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 17, shadowColor: "#000000", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabText: { color: "#FFFFFF", fontSize: 24, lineHeight: 25, marginRight: 6, marginTop: -2 },
  fabLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  fabPressed: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
