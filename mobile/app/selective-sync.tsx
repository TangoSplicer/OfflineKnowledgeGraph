import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { SyncProgressPanel } from "@/components/sync-progress-panel";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { decryptSelectiveGraph, encryptSelectiveGraph, mergeSelectedGraphBackups, previewSelectiveGraphSync, type SelectiveGraphSyncPayload, type SelectiveGraphSyncPreview } from "@/lib/encrypted-graph-sync";
import { createGraphBackup } from "@/lib/relationship-backup";
import { appendAndSaveSyncAuditEvent } from "@/lib/sync-audit";
import { isSyncProgressActive, syncProgress, type SyncProgressState } from "@/lib/sync-progress";
import { useRelationshipStore } from "@/lib/relationship-store";
import { trpc } from "@/lib/trpc";

export default function SelectiveSyncScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { allConcepts, allConnections, replaceGraph } = useRelationshipStore();
  const [deviceId, setDeviceId] = useState<string>("");
  const [trusted, setTrusted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collectionId, setCollectionId] = useState("");
  const [label, setLabel] = useState("Research subset");
  const [passphrase, setPassphrase] = useState("");
  const [remotePayload, setRemotePayload] = useState<SelectiveGraphSyncPayload | null>(null);
  const [preview, setPreview] = useState<SelectiveGraphSyncPreview | null>(null);
  const [status, setStatus] = useState("Choose concepts to sync a focused encrypted subgraph.");
  const [progress, setProgress] = useState<SyncProgressState>(() => syncProgress("idle"));

  const localGraph = useMemo(() => createGraphBackup(allConcepts, allConnections), [allConcepts, allConnections]);
  useEffect(() => { setSelectedIds((current) => current.size ? new Set([...current].filter((id) => allConcepts.some((concept) => concept.id === id))) : new Set(allConcepts.map((concept) => concept.id))); }, [allConcepts]);
  useEffect(() => {
    let active = true;
    void import("@/lib/trusted-devices").then(({ getOrCreateTrustedDevice }) => getOrCreateTrustedDevice()).then((device) => { if (active) setDeviceId(device.id); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const devices = trpc.trustedDevices.list.useQuery(undefined, { enabled: isAuthenticated });
  useEffect(() => { setTrusted(Boolean(deviceId && devices.data?.some((item) => item.id === deviceId && !item.revokedAt))); }, [deviceId, devices.data]);
  const collections = trpc.subgraphSync.list.useQuery({ deviceId }, { enabled: Boolean(isAuthenticated && trusted && deviceId) });
  const remote = trpc.subgraphSync.get.useQuery({ deviceId, id: collectionId }, { enabled: Boolean(isAuthenticated && trusted && deviceId && collectionId) });
  const upload = trpc.subgraphSync.put.useMutation();
  const busy = loading || devices.isFetching || collections.isFetching || remote.isFetching || upload.isPending || isSyncProgressActive(progress);

  const authorize = async (prompt: string) => { setProgress(syncProgress("authorizing")); const result = await confirmSensitiveSyncAction(prompt); setStatus(result.message); if (!result.allowed) setProgress(syncProgress("error", "Device confirmation was not completed")); return result.allowed; };
  const requireReady = () => {
    if (!isAuthenticated) { setStatus("Sign in only when you want to use encrypted cross-device subgraph sync."); return false; }
    if (!trusted) { setStatus("Trust this device in Complete-graph sync before using selective sync."); return false; }
    if (selectedIds.size === 0) { setStatus("Select at least one concept."); return false; }
    if (passphrase.trim().length < 12) { setStatus("Enter a sync passphrase with at least 12 characters."); return false; }
    return true;
  };
  const toggle = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const download = async () => {
    if (!collectionId || !requireReady() || !(await authorize("Confirm encrypted subgraph recovery"))) return;
    setProgress(syncProgress("fetching"));
    const response = await remote.refetch();
    if (!response.data) { setProgress(syncProgress("idle")); setStatus("That remote subgraph is no longer available."); return; }
    try {
      setProgress(syncProgress("decrypting"));
      const payload = await decryptSelectiveGraph(response.data.envelope, passphrase);
      setRemotePayload(payload);
      const nextPreview = previewSelectiveGraphSync(localGraph, payload.graph, payload.selection);
      setPreview(nextPreview);
      setProgress(syncProgress("review"));
      setStatus(`Remote subset verified: ${nextPreview.selectedConcepts} concepts and ${nextPreview.selectedRelationships} relationships.`);
    } catch (error) { setProgress(syncProgress("error")); setStatus(error instanceof Error ? error.message : "Unable to decrypt that subgraph."); }
  };
  const uploadSelected = async (expectedRevision = remote.data?.revision ?? 0) => {
    if (!requireReady() || !(await authorize("Confirm encrypted subgraph upload"))) return;
    try {
      const id = collectionId || `subgraph-${Date.now()}`;
      const selection = { conceptIds: [...selectedIds], label: label.trim() || "Research subset" };
      setProgress(syncProgress("encrypting"));
      const envelope = JSON.stringify(await encryptSelectiveGraph(localGraph, selection, passphrase));
      setProgress(syncProgress("uploading"));
      const result = await upload.mutateAsync({ deviceId, id, label: selection.label, envelope, expectedRevision });
      if (result.status === "conflict") { setProgress(syncProgress("review", "A newer encrypted subgraph needs review")); setStatus("A newer encrypted subgraph exists. Download and review it before overwriting anything."); await collections.refetch(); await remote.refetch(); return; }
      setProgress(syncProgress("verifying"));
      setCollectionId(id); setRemotePayload(null); setPreview(null); setPassphrase(""); await collections.refetch();
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "subgraph-uploaded", scope: "subgraph", deviceId, summary: "Encrypted subgraph uploaded", metadata: { id, concepts: selectedIds.size, revision: result.revision } });
      setProgress(syncProgress("complete"));
      setStatus(`Encrypted subgraph saved at revision ${result.revision}.`);
    } catch (error) { setProgress(syncProgress("error")); setStatus(error instanceof Error ? error.message : "Unable to upload this encrypted subgraph."); }
  };
  const recoverRemote = async () => {
    if (!remotePayload || !(await authorize("Confirm selective graph recovery"))) return;
    const merged = mergeSelectedGraphBackups(localGraph, remotePayload.graph, remotePayload.selection.conceptIds);
    replaceGraph(merged.concepts, merged.connections);
    await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "subgraph-recovered", scope: "subgraph", deviceId, summary: "Selected encrypted subgraph merged into the local graph", metadata: { id: collectionId, concepts: remotePayload.graph.concepts.length, relationships: remotePayload.graph.connections.length } });
    setStatus(`Recovered ${remotePayload.graph.concepts.length} concepts and ${remotePayload.graph.connections.length} relationships without replacing unrelated local graph data.`);
  };
  const keepLocal = async () => { await uploadSelected(remote.data?.revision ?? 0); };

  if (!isAuthenticated) return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><View style={styles.content}><View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>SELECTIVE SYNC</Text><Text style={styles.title}>Focused graph copies</Text></View></View><View style={styles.signIn}><Text style={styles.sectionTitle}>Keep core graph work local</Text><Text style={styles.body}>Your local graph never needs an account. Sign in only to encrypt a selected subgraph for another trusted device.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Sign in to enable selective sync</Text></Pressable></View></View></ScreenContainer>;

  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><FlatList data={allConcepts} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View><View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>ENCRYPTED SUBGRAPHS</Text><Text style={styles.title}>Focused graph copies</Text></View></View><View style={styles.hero}><Text style={styles.heroTitle}>Only selected endpoints travel</Text><Text style={styles.heroText}>The encrypted bundle contains selected concepts and only relationships whose two endpoints are selected. Recovery merges the subset into this graph and preserves unrelated local work.</Text></View><Text style={styles.sectionTitle}>REMOTE COLLECTION</Text><View style={styles.remoteRow}><Pressable onPress={() => { setCollectionId(""); setRemotePayload(null); setPreview(null); }} style={[styles.remoteChoice, !collectionId && styles.remoteSelected]}><Text style={styles.remoteChoiceText}>New copy</Text></Pressable>{(collections.data ?? []).map((item) => <Pressable key={item.id} onPress={() => { setCollectionId(item.id); setLabel(item.label); setRemotePayload(null); setPreview(null); }} style={[styles.remoteChoice, collectionId === item.id && styles.remoteSelected]}><Text numberOfLines={1} style={styles.remoteChoiceText}>{item.label}</Text></Pressable>)}</View><TextInput value={label} onChangeText={setLabel} style={styles.input} placeholder="Collection label" placeholderTextColor="#71839F" /><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Sync passphrase" placeholderTextColor="#71839F" /><View style={styles.actions}><Pressable disabled={busy} onPress={() => void download()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.secondaryText}>Download & preview</Text></Pressable><Pressable disabled={busy} onPress={() => void uploadSelected()} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.primaryText}>Encrypt selection</Text></Pressable></View><SyncProgressPanel progress={progress} />{preview ? <View style={styles.preview}><Text style={styles.previewEyebrow}>SAFE RECOVERY PREVIEW</Text><Text style={styles.body}>{preview.selectedConcepts} concepts · {preview.selectedRelationships} relationships · {preview.newConcepts} new concepts · {preview.newRelationships} new relationships.</Text><Pressable onPress={() => void recoverRemote()} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}><Text style={styles.choiceText}>Merge selected subset locally</Text><Text style={styles.choiceArrow}>→</Text></Pressable><Pressable onPress={() => void keepLocal()} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}><Text style={styles.choiceText}>Keep local selection on remote</Text><Text style={styles.choiceArrow}>→</Text></Pressable></View> : null}<Text style={styles.status}>{status}</Text><Text style={styles.sectionTitle}>SELECT CONCEPTS · {selectedIds.size}/{allConcepts.length}</Text></View>} renderItem={({ item }) => <Pressable onPress={() => toggle(item.id)} style={({ pressed }) => [styles.concept, selectedIds.has(item.id) && styles.conceptSelected, pressed && styles.pressed]}><View style={styles.checkbox}>{selectedIds.has(item.id) ? <Text style={styles.check}>✓</Text> : null}</View><View style={styles.conceptCopy}><Text style={styles.conceptTitle}>{item.title}</Text><Text style={styles.conceptMeta}>{item.kind}{item.archivedAt ? " · archived" : ""}</Text></View></Pressable>} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Create a concept before selecting a subgraph.</Text><Text style={styles.body}>Selective sync is intentionally unavailable for an empty local graph.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 }, nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, hero: { borderRadius: 17, padding: 15, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, heroTitle: { color: "#ECEAFF", fontSize: 14, fontWeight: "900" }, heroText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, sectionTitle: { color: "#F3F6FC", fontSize: 12, fontWeight: "900", marginTop: 15, marginBottom: 7 }, remoteRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" }, remoteChoice: { maxWidth: 170, minHeight: 32, borderRadius: 9, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#1C2B41", borderWidth: 1, borderColor: "#3A4E6C" }, remoteSelected: { backgroundColor: "#514AA7", borderColor: "#8F85FF" }, remoteChoiceText: { color: "#EEF3FC", fontSize: 9, fontWeight: "800" }, input: { minHeight: 42, borderRadius: 10, paddingHorizontal: 11, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 12, marginTop: 8 }, actions: { flexDirection: "row", gap: 8, marginTop: 10 }, primary: { flex: 1, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 8 }, secondary: { flex: 1, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#203E4C", borderWidth: 1, borderColor: "#5696A3", paddingHorizontal: 8 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", textAlign: "center" }, secondaryText: { color: "#C7EEF1", fontSize: 10, fontWeight: "900", textAlign: "center" }, preview: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: "#221F3A", borderWidth: 1, borderColor: "#5B5599" }, previewEyebrow: { color: "#C9C2FF", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginBottom: 5 }, choice: { minHeight: 36, borderRadius: 9, paddingHorizontal: 10, marginTop: 7, backgroundColor: "#2E2A4C", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, choiceText: { color: "#F2F0FF", fontSize: 10, fontWeight: "800" }, choiceArrow: { color: "#B9B1FF", fontSize: 17 }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, concept: { minHeight: 65, borderRadius: 13, padding: 11, marginBottom: 7, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, conceptSelected: { borderColor: "#7166E1", backgroundColor: "#1C2348" }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: "#677B9E", alignItems: "center", justifyContent: "center" }, check: { color: "#A8A1FF", fontSize: 15, fontWeight: "900" }, conceptCopy: { flex: 1 }, conceptTitle: { color: "#EAF0FA", fontSize: 11, fontWeight: "900" }, conceptMeta: { color: "#90A1BA", fontSize: 9, marginTop: 4 }, signIn: { marginTop: 10, borderRadius: 16, padding: 14, backgroundColor: "#16323A", borderWidth: 1, borderColor: "#3D7681" }, body: { color: "#A9B7CD", fontSize: 11, lineHeight: 17 }, empty: { padding: 15, borderRadius: 14, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, emptyTitle: { color: "#EAF0FA", fontSize: 12, fontWeight: "900", marginBottom: 5 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.5 },
});
