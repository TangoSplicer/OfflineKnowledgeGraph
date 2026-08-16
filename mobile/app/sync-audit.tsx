import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { decryptAuditLedger, encryptAuditLedger, previewAuditSyncConflict, resolveAuditSyncConflict, type AuditSyncConflictPreview } from "@/lib/encrypted-audit-sync";
import { appendAndSaveSyncAuditEvent, auditOperationLabel, createEmptySyncAuditLedger, loadSyncAuditLedger, saveSyncAuditLedger, verifySyncAuditLedger, type SyncAuditLedger } from "@/lib/sync-audit";
import { trpc } from "@/lib/trpc";

export default function SyncAuditScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [ledger, setLedger] = useState<SyncAuditLedger>(createEmptySyncAuditLedger());
  const [remoteLedger, setRemoteLedger] = useState<SyncAuditLedger | null>(null);
  const [preview, setPreview] = useState<AuditSyncConflictPreview | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [status, setStatus] = useState("Every encrypted sync action is recorded in a local hash chain.");
  const remote = trpc.auditSync.get.useQuery(undefined, { enabled: isAuthenticated });
  const upload = trpc.auditSync.put.useMutation();
  const busy = loading || remote.isFetching || upload.isPending;
  useEffect(() => {
    if (!remoteLedger) { setPreview(null); return; }
    void previewAuditSyncConflict(ledger, remoteLedger).then(setPreview).catch(() => setPreview(null));
  }, [ledger, remoteLedger]);

  const refresh = async () => {
    try {
      const next = await loadSyncAuditLedger();
      setLedger(next);
      setStatus(`${next.events.length} local audit events verified.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to verify local audit history."); }
  };
  useEffect(() => { void refresh(); }, []);

  const authorize = async (prompt: string) => {
    const result = await confirmSensitiveSyncAction(prompt);
    setStatus(result.message);
    return result.allowed;
  };
  const requirePassphrase = () => {
    if (passphrase.trim().length >= 12) return true;
    setStatus("Enter the same 12-character minimum sync passphrase used for graph recovery.");
    return false;
  };
  const download = async () => {
    if (!requirePassphrase() || !(await authorize("Confirm encrypted audit-history recovery"))) return;
    const response = await remote.refetch();
    if (!response.data) { setStatus("No encrypted remote audit history exists yet."); return; }
    try {
      const decrypted = await decryptAuditLedger(response.data.envelope, passphrase);
      setRemoteLedger(decrypted);
      setStatus(`Remote audit history verified locally: ${decrypted.events.length} events.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to decrypt the remote audit history."); }
  };
  const uploadLedger = async (next: SyncAuditLedger = ledger) => {
    if (!requirePassphrase() || !(await authorize("Confirm encrypted audit-history upload"))) return;
    try {
      const envelope = JSON.stringify(await encryptAuditLedger(next, passphrase));
      const result = await upload.mutateAsync({ envelope, expectedRevision: remote.data?.revision ?? 0 });
      if (result.status === "conflict") { setStatus("A newer encrypted audit history exists. Download and review it before choosing a recovery path."); await remote.refetch(); return; }
      setLedger(next);
      setRemoteLedger(null);
      await saveSyncAuditLedger(next);
      setPassphrase("");
      setStatus(`Encrypted audit history synced at revision ${result.revision}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to upload the encrypted audit history."); }
  };
  const resolve = async (strategy: "merge" | "local" | "remote") => {
    if (!remoteLedger) return;
    try {
      const next = await resolveAuditSyncConflict(ledger, remoteLedger, strategy);
      await saveSyncAuditLedger(next);
      setLedger(next);
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "audit-merged", scope: "trusted-device", summary: `Audit history recovery selected: ${strategy}`, metadata: { strategy, localEvents: ledger.events.length, remoteEvents: remoteLedger.events.length } });
      await uploadLedger(next);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to recover the encrypted audit history."); }
  };

  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><FlatList data={[...ledger.events].reverse()} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View><View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>SECURITY HISTORY</Text><Text style={styles.title}>Sync audit trail</Text></View></View><View style={styles.hero}><Text style={styles.heroTitle}>Tamper-evident by design</Text><Text style={styles.heroText}>Each event includes the digest of the previous event. The app verifies the chain before it displays or uploads the history. The service receives only an encrypted ledger.</Text><Text style={styles.verified}>{ledger.events.length ? "LOCAL CHAIN VERIFIED" : "NO EVENTS RECORDED YET"}</Text></View>{!isAuthenticated ? <View style={styles.signIn}><Text style={styles.sectionTitle}>Cross-device audit history</Text><Text style={styles.body}>Local audit history works without login. Sign in only when you want to encrypt and review the same history on another trusted device.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Sign in to sync history</Text></Pressable></View> : <View style={styles.syncCard}><Text style={styles.sectionTitle}>Encrypted history sync</Text><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Sync passphrase" placeholderTextColor="#71839F" style={styles.input} /><View style={styles.actions}><Pressable disabled={busy} onPress={() => void download()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.secondaryText}>Download & verify</Text></Pressable><Pressable disabled={busy} onPress={() => void uploadLedger()} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.primaryText}>Encrypt & upload</Text></Pressable></View>{preview ? <View style={styles.conflict}><Text style={styles.conflictEyebrow}>REMOTE HISTORY REVIEW</Text><Text style={styles.body}>{preview.localEvents} local events · {preview.remoteEvents} remote events · {preview.mergedEvents} after merge.</Text><ConflictChoice label="Merge verified histories" onPress={() => void resolve("merge")} /><ConflictChoice label="Keep local history" onPress={() => void resolve("local")} /><ConflictChoice label="Use remote history" onPress={() => void resolve("remote")} /></View> : null}</View>}<Text style={styles.status}>{status}</Text><Text style={styles.sectionTitle}>RECENT EVENTS</Text></View>} renderItem={({ item }) => <View style={styles.event}><View style={styles.eventMark}><Text style={styles.eventMarkText}>✓</Text></View><View style={styles.eventCopy}><Text style={styles.eventTitle}>{auditOperationLabel(item.operation)}</Text><Text style={styles.eventSummary}>{item.summary}</Text><Text style={styles.eventMeta}>{new Date(item.createdAt).toLocaleString()} · {item.scope}</Text><Text style={styles.digest}>Digest {item.digest.slice(0, 18)}…</Text></View></View>} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Your security history will appear here.</Text><Text style={styles.body}>Trusting a device, recovering a graph, or running a scheduled backup creates a reviewable local event.</Text></View>} /></ScreenContainer>;
}

function ConflictChoice({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}><Text style={styles.choiceText}>{label}</Text><Text style={styles.choiceArrow}>→</Text></Pressable>; }

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, hero: { borderRadius: 17, padding: 15, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, heroTitle: { color: "#ECEAFF", fontSize: 14, fontWeight: "900" }, heroText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, verified: { color: "#8EF0C2", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 11 }, signIn: { borderRadius: 16, marginTop: 10, padding: 14, backgroundColor: "#16323A", borderWidth: 1, borderColor: "#3D7681" }, syncCard: { borderRadius: 16, marginTop: 10, padding: 13, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" }, sectionTitle: { color: "#F3F6FC", fontSize: 12, fontWeight: "900", marginTop: 15, marginBottom: 7 }, body: { color: "#A9B7CD", fontSize: 11, lineHeight: 17 }, input: { minHeight: 43, borderRadius: 11, paddingHorizontal: 12, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 12, marginTop: 8 }, actions: { flexDirection: "row", gap: 8, marginTop: 10 }, primary: { minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 12, marginTop: 10, flex: 1 }, secondary: { flex: 1, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#203E4C", borderWidth: 1, borderColor: "#5696A3", paddingHorizontal: 8 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", textAlign: "center" }, secondaryText: { color: "#C7EEF1", fontSize: 10, fontWeight: "900", textAlign: "center" }, conflict: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: "#221F3A", borderWidth: 1, borderColor: "#5B5599" }, conflictEyebrow: { color: "#C9C2FF", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginBottom: 5 }, choice: { minHeight: 36, borderRadius: 9, paddingHorizontal: 10, marginTop: 7, backgroundColor: "#2E2A4C", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, choiceText: { color: "#F2F0FF", fontSize: 10, fontWeight: "800" }, choiceArrow: { color: "#B9B1FF", fontSize: 17 }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, event: { minHeight: 77, borderRadius: 14, padding: 12, marginBottom: 7, flexDirection: "row", gap: 10, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, eventMark: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#1B4F4C", alignItems: "center", justifyContent: "center" }, eventMarkText: { color: "#8EF0C2", fontSize: 12, fontWeight: "900" }, eventCopy: { flex: 1 }, eventTitle: { color: "#EAF0FA", fontSize: 11, fontWeight: "900" }, eventSummary: { color: "#A8B5CA", fontSize: 10, lineHeight: 15, marginTop: 3 }, eventMeta: { color: "#8392AE", fontSize: 9, marginTop: 5 }, digest: { color: "#60718E", fontSize: 8, marginTop: 3 }, empty: { padding: 15, borderRadius: 14, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, emptyTitle: { color: "#EAF0FA", fontSize: 12, fontWeight: "900", marginBottom: 5 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.5 }, loader: { marginTop: 20 },
});
