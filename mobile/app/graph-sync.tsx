import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { SyncProgressPanel } from "@/components/sync-progress-panel";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { decryptCompleteGraph, encryptCompleteGraph, previewGraphSyncConflict, resolveGraphSyncConflict } from "@/lib/encrypted-graph-sync";
import { createGraphBackup, type GraphBackup } from "@/lib/relationship-backup";
import { appendAndSaveSyncAuditEvent } from "@/lib/sync-audit";
import { isSyncProgressActive, syncProgress, type SyncProgressState } from "@/lib/sync-progress";
import { useRelationshipStore } from "@/lib/relationship-store";
import { defaultDeviceLabel, getOrCreateTrustedDevice, normalizeDeviceLabel, type LocalTrustedDevice } from "@/lib/trusted-devices";
import { trpc } from "@/lib/trpc";

export default function GraphSyncScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const { allConcepts, allConnections, replaceGraph } = useRelationshipStore();
  const [device, setDevice] = useState<LocalTrustedDevice | null>(null);
  const [label, setLabel] = useState(defaultDeviceLabel());
  const [passphrase, setPassphrase] = useState("");
  const [status, setStatus] = useState("Sign in, trust this device, then use a passphrase to synchronize your encrypted graph.");
  const [progress, setProgress] = useState<SyncProgressState>(() => syncProgress("idle"));
  const [remoteGraph, setRemoteGraph] = useState<GraphBackup | null>(null);
  useEffect(() => { void getOrCreateTrustedDevice().then((identity) => { setDevice(identity); setLabel(identity.label); }).catch(() => setStatus("Unable to prepare a trusted-device identity.")); }, []);

  const devices = trpc.trustedDevices.list.useQuery(undefined, { enabled: isAuthenticated });
  const register = trpc.trustedDevices.register.useMutation();
  const revoke = trpc.trustedDevices.revoke.useMutation();
  const trusted = Boolean(device && devices.data?.some((item) => item.id === device.id && !item.revokedAt));
  const deviceId = device?.id ?? "00000000-0000-4000-8000-000000000000";
  const remote = trpc.graphSync.get.useQuery({ deviceId }, { enabled: isAuthenticated && trusted && Boolean(device) });
  const uploadMutation = trpc.graphSync.put.useMutation();
  const deleteMutation = trpc.graphSync.delete.useMutation();
  const localGraph = useMemo(() => createGraphBackup(allConcepts, allConnections), [allConcepts, allConnections]);
  const busy = loading || !device || register.isPending || revoke.isPending || remote.isFetching || uploadMutation.isPending || deleteMutation.isPending || isSyncProgressActive(progress);

  const requirePassphrase = () => {
    if (passphrase.trim().length >= 12) return true;
    setStatus("Enter a sync passphrase with at least 12 characters. It is never uploaded.");
    return false;
  };
  const authorize = async (prompt: string) => {
    setProgress(syncProgress("authorizing"));
    const result = await confirmSensitiveSyncAction(prompt);
    setStatus(result.message);
    if (!result.allowed) setProgress(syncProgress("error", "Device confirmation was not completed"));
    return result.allowed;
  };
  const enroll = async () => {
    if (!device) return;
    try {
      await register.mutateAsync({ id: device.id, label: normalizeDeviceLabel(label), platform: device.platform });
      setStatus("This device is trusted for encrypted complete-graph sync.");
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "device-trusted", scope: "trusted-device", deviceId: device.id, summary: "Trusted device enrolled for encrypted sync", metadata: { platform: device.platform } }).catch(() => undefined);
      await devices.refetch();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to trust this device."); }
  };
  const decryptRemote = async () => {
    if (!requirePassphrase() || !(await authorize("Confirm complete graph recovery"))) return;
    setProgress(syncProgress("fetching"));
    const response = await remote.refetch();
    if (!response.data) { setRemoteGraph(null); setProgress(syncProgress("idle")); setStatus("No remote encrypted graph exists yet. Upload this graph to start sync."); return; }
    try {
      setProgress(syncProgress("decrypting"));
      const graph = await decryptCompleteGraph(response.data.envelope, passphrase);
      setRemoteGraph(graph);
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "graph-downloaded", scope: "complete-graph", deviceId: device?.id, summary: "Encrypted complete graph decrypted locally", metadata: { concepts: graph.concepts.length, relationships: graph.connections.length } }).catch(() => undefined);
      const preview = previewGraphSyncConflict(localGraph, graph);
      setProgress(syncProgress("review"));
      setStatus(`Remote graph decrypted locally: ${preview.localConcepts} local concepts, ${preview.remoteConcepts} remote concepts, ${preview.mergedConcepts} after merge.`);
    } catch (error) { setProgress(syncProgress("error")); setStatus(error instanceof Error ? error.message : "Unable to decrypt the remote graph."); }
  };
  const upload = async (graph: GraphBackup, expectedRevision: number) => {
    if (!device || !requirePassphrase() || !(await authorize("Confirm encrypted complete graph upload"))) return;
    try {
      setProgress(syncProgress("encrypting"));
      const envelope = JSON.stringify(await encryptCompleteGraph(graph.concepts, graph.connections, passphrase));
      setProgress(syncProgress("uploading"));
      const result = await uploadMutation.mutateAsync({ deviceId: device.id, envelope, expectedRevision });
      if (result.status === "conflict") { setProgress(syncProgress("review", "A newer encrypted graph needs review")); setStatus("A newer encrypted graph exists. Download and review it before choosing a recovery path."); await remote.refetch(); return; }
      setProgress(syncProgress("verifying"));
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "graph-uploaded", scope: "complete-graph", deviceId: device.id, summary: "Encrypted complete graph uploaded", metadata: { concepts: graph.concepts.length, relationships: graph.connections.length, revision: result.revision } }).catch(() => undefined);
      setProgress(syncProgress("complete"));
      setStatus(`Encrypted complete graph synced at revision ${result.revision}.`);
      setRemoteGraph(null);
      setPassphrase("");
      await remote.refetch();
    } catch (error) { setProgress(syncProgress("error")); setStatus(error instanceof Error ? error.message : "Unable to sync the encrypted complete graph."); }
  };
  const resolveConflict = async (strategy: "merge" | "local" | "remote") => {
    if (!remoteGraph) return;
    const resolved = resolveGraphSyncConflict(localGraph, remoteGraph, strategy);
    if (strategy !== "local") replaceGraph(resolved.concepts, resolved.connections);
    await upload(resolved, remote.data?.revision ?? 0);
  };
  const revokeDevice = async (id: string) => {
    if (!(await authorize("Confirm trusted device revocation"))) return;
    try { await revoke.mutateAsync({ id }); await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "device-revoked", scope: "trusted-device", deviceId: id, summary: "Trusted sync device revoked", metadata: { wasCurrentDevice: id === device?.id } }).catch(() => undefined); setStatus(id === device?.id ? "This device was revoked. Trust it again before graph sync." : "Trusted device revoked."); await devices.refetch(); } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to revoke this device."); }
  };
  const deleteRemote = async () => {
    if (!device || !(await authorize("Confirm remote encrypted graph removal"))) return;
    try { await deleteMutation.mutateAsync({ deviceId: device.id }); await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "graph-removed", scope: "complete-graph", deviceId: device.id, summary: "Remote encrypted complete graph removed", metadata: {} }).catch(() => undefined); setRemoteGraph(null); setStatus("The remote encrypted graph was removed. This device remains unchanged."); await remote.refetch(); } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to remove the remote graph."); }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={devices.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>PRIVATE COMPLETE-GRAPH SYNC</Text><Text style={styles.title}>Trusted devices</Text></View></View>
            <View style={styles.trustCard}><Text style={styles.trustTitle}>Encrypted before it leaves your device</Text><Text style={styles.trustText}>Trusted devices use your passphrase to decrypt concepts, links, notes, sources, and archived records. The service stores only ciphertext.</Text></View>
            {loading || !device ? <ActivityIndicator color="#8F85FF" style={styles.loader} /> : !isAuthenticated ? <View style={styles.signIn}><Text style={styles.signInTitle}>Sign in to connect devices</Text><Text style={styles.signInText}>Local graph use stays available without an account. Sign-in is only for encrypted cross-device sync.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.fullPrimary, pressed && styles.pressed]}><Text style={styles.primaryText}>Sign in to enable sync</Text></Pressable></View> : <>
              <View style={styles.deviceCard}><Text style={styles.label}>THIS DEVICE</Text><TextInput value={label} onChangeText={setLabel} maxLength={120} style={styles.input} placeholder="Device label" placeholderTextColor="#71839F" /><Pressable disabled={busy} onPress={() => void enroll()} style={({ pressed }) => [styles.fullPrimary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.primaryText}>{trusted ? "Update trusted device" : "Trust this device"}</Text></Pressable></View>
              {trusted ? <><Text style={styles.label}>SYNC PASSPHRASE</Text><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="At least 12 characters" placeholderTextColor="#71839F" style={styles.input} /><Text style={styles.hint}>Biometric or device-passcode confirmation is requested for recovery, upload, deletion, and device revocation where supported.</Text><View style={styles.actions}><Pressable disabled={busy} onPress={() => void decryptRemote()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.secondaryText}>Download & decrypt</Text></Pressable><Pressable disabled={busy} onPress={() => void upload(localGraph, remote.data?.revision ?? 0)} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.primaryText}>Encrypt & upload</Text></Pressable></View><SyncProgressPanel progress={progress} />{remoteGraph ? <ConflictPanel local={localGraph} remote={remoteGraph} busy={busy} onChoose={(strategy) => void resolveConflict(strategy)} /> : null}{remote.data ? <Pressable disabled={busy} onPress={() => void deleteRemote()} style={({ pressed }) => [styles.delete, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.deleteText}>Remove remote encrypted graph</Text></Pressable> : null}</> : <Text style={styles.hint}>Trust this device before encrypted complete-graph sync becomes available.</Text>}
              <Text style={styles.status}>{status}</Text><Text style={styles.section}>TRUSTED DEVICES</Text>
            </>}
          </View>
        }
        renderItem={({ item }) => <View style={[styles.deviceRow, item.revokedAt ? styles.revoked : undefined]}><View style={styles.deviceInfo}><Text style={styles.deviceName}>{item.label}</Text><Text style={styles.deviceMeta}>{item.platform} · {item.id === device?.id ? "This device" : item.revokedAt ? "Revoked" : "Active"}</Text></View>{!item.revokedAt ? <Pressable disabled={busy} onPress={() => void revokeDevice(item.id)} style={({ pressed }) => [styles.revoke, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.revokeText}>Revoke</Text></Pressable> : null}</View>}
        ListEmptyComponent={isAuthenticated ? <View style={styles.empty}><Text style={styles.emptyText}>Register this device to begin encrypted complete-graph sync.</Text></View> : null}
      />
    </ScreenContainer>
  );
}
function ConflictPanel({ local, remote, busy, onChoose }: { local: GraphBackup; remote: GraphBackup; busy: boolean; onChoose: (strategy: "merge" | "local" | "remote") => void }) {
  const preview = previewGraphSyncConflict(local, remote);
  return <View style={styles.conflict}><Text style={styles.conflictEyebrow}>DECRYPTED GRAPH CONFLICT</Text><Text style={styles.conflictTitle}>Choose a recovery path</Text><Text style={styles.conflictText}>{preview.localConcepts} local / {preview.remoteConcepts} remote concepts · merge retains {preview.mergedConcepts}. Relationships: {preview.localRelationships} local / {preview.remoteRelationships} remote / {preview.mergedRelationships} merged.</Text><ConflictChoice label="Merge both graphs" detail="Keep newer concept records and both relationship sets" disabled={busy} onPress={() => onChoose("merge")} /><ConflictChoice label="Keep this device’s graph" detail="Encrypt this local graph over the remote copy" disabled={busy} onPress={() => onChoose("local")} /><ConflictChoice label="Use remote graph" detail="Replace this device after explicit confirmation" disabled={busy} onPress={() => onChoose("remote")} /></View>;
}
function ConflictChoice({ label, detail, disabled, onPress }: { label: string; detail: string; disabled: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.choice, pressed && styles.pressed, disabled && styles.disabled]}><View><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.choiceDetail}>{detail}</Text></View><Text style={styles.choiceArrow}>→</Text></Pressable>; }
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 46 }, nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, trustCard: { borderRadius: 17, padding: 14, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, trustTitle: { color: "#ECEAFF", fontSize: 13, fontWeight: "900" }, trustText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, loader: { marginTop: 30 }, signIn: { borderRadius: 16, marginTop: 10, padding: 14, backgroundColor: "#16323A", borderWidth: 1, borderColor: "#3D7681" }, signInTitle: { color: "#D6F3F4", fontSize: 14, fontWeight: "900" }, signInText: { color: "#A9C6CC", fontSize: 11, lineHeight: 16, marginTop: 5 }, deviceCard: { borderRadius: 16, marginTop: 11, padding: 12, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" }, label: { color: "#8392AE", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 14, marginBottom: 6 }, input: { minHeight: 45, borderRadius: 11, paddingHorizontal: 12, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 12 }, hint: { color: "#8898B2", fontSize: 10, lineHeight: 15, marginTop: 6 }, fullPrimary: { minHeight: 42, marginTop: 9, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 9 }, actions: { flexDirection: "row", gap: 8, marginTop: 12 }, primary: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 8 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", textAlign: "center" }, secondary: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#203E4C", borderWidth: 1, borderColor: "#5696A3", paddingHorizontal: 8 }, secondaryText: { color: "#C7EEF1", fontSize: 10, fontWeight: "900", textAlign: "center" }, delete: { minHeight: 39, borderRadius: 11, marginTop: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#874C62", backgroundColor: "#311F2B" }, deleteText: { color: "#F1B7C4", fontSize: 10, fontWeight: "900" }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, section: { color: "#8392AE", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 18, marginBottom: 8 }, deviceRow: { minHeight: 63, borderRadius: 14, paddingHorizontal: 12, marginBottom: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, revoked: { opacity: 0.55 }, deviceInfo: { flex: 1, paddingRight: 8 }, deviceName: { color: "#EAF0FA", fontSize: 12, fontWeight: "900" }, deviceMeta: { color: "#90A1BA", fontSize: 9, marginTop: 4 }, revoke: { minHeight: 31, borderRadius: 9, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#93556E", backgroundColor: "#32202D" }, revokeText: { color: "#F1B7C5", fontSize: 9, fontWeight: "900" }, empty: { borderRadius: 14, padding: 13, backgroundColor: "#131D2E", borderWidth: 1, borderStyle: "dashed", borderColor: "#3A4D6B" }, emptyText: { color: "#92A3BC", fontSize: 11 }, conflict: { borderRadius: 16, marginTop: 12, padding: 13, backgroundColor: "#2B203A", borderWidth: 1, borderColor: "#795987" }, conflictEyebrow: { color: "#D4B2E7", fontSize: 8, letterSpacing: 1, fontWeight: "900" }, conflictTitle: { color: "#F3E9FA", fontSize: 14, fontWeight: "900", marginTop: 4 }, conflictText: { color: "#C7B0D2", fontSize: 10, lineHeight: 15, marginTop: 6, marginBottom: 8 }, choice: { minHeight: 52, borderRadius: 11, paddingHorizontal: 11, marginTop: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#392C49", borderWidth: 1, borderColor: "#735D87" }, choiceTitle: { color: "#F0E8F5", fontSize: 11, fontWeight: "900" }, choiceDetail: { color: "#C0ACCB", fontSize: 9, marginTop: 3 }, choiceArrow: { color: "#D9BDE9", fontSize: 17 }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
