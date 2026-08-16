import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { encryptCompleteGraph, decryptCompleteGraph } from "@/lib/encrypted-graph-sync";
import { createGraphBackup } from "@/lib/relationship-backup";
import { appendAndSaveSyncAuditEvent } from "@/lib/sync-audit";
import { getOrCreateTrustedDevice } from "@/lib/trusted-devices";
import { useRelationshipStore } from "@/lib/relationship-store";
import { trpc } from "@/lib/trpc";
import { compareSnapshotWithLocal, type SnapshotDiffResult } from "@/lib/snapshot-diff";

export default function EncryptedSnapshotsScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { allConcepts, allConnections, replaceGraph } = useRelationshipStore();
  const [deviceId, setDeviceId] = useState("");
  const [trusted, setTrusted] = useState(false);
  const [label, setLabel] = useState("Manual recovery point");
  const [passphrase, setPassphrase] = useState("");
  const [filterText, setFilterText] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [diff, setDiff] = useState<SnapshotDiffResult | null>(null);
  const [status, setStatus] = useState("Keep up to ten opaque encrypted graph snapshots for explicit rollback.");
  const devices = trpc.trustedDevices.list.useQuery(undefined, { enabled: isAuthenticated });
  useEffect(() => { void getOrCreateTrustedDevice().then((device) => setDeviceId(device.id)).catch(() => undefined); }, []);
  useEffect(() => { setTrusted(Boolean(deviceId && devices.data?.some((item) => item.id === deviceId && !item.revokedAt))); }, [deviceId, devices.data]);
  const snapshots = trpc.graphSnapshots.list.useQuery({ deviceId }, { enabled: Boolean(isAuthenticated && trusted && deviceId) });
  const selected = trpc.graphSnapshots.get.useQuery({ deviceId, id: selectedId }, { enabled: Boolean(isAuthenticated && trusted && deviceId && selectedId) });
  const graphRemote = trpc.graphSync.get.useQuery({ deviceId }, { enabled: Boolean(isAuthenticated && trusted && deviceId) });
  const localGraph = useMemo(() => createGraphBackup(allConcepts, allConnections), [allConcepts, allConnections]);
  const create = trpc.graphSnapshots.put.useMutation();
  const remove = trpc.graphSnapshots.delete.useMutation();
  const snapshotRows = snapshots.data ?? [];
  const availableKinds = useMemo(() => Array.from(new Set(snapshotRows.flatMap((item) => parseSnapshotMetadata(item.conceptKinds)))).sort(), [snapshotRows]);
  const filteredSnapshots = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    return snapshotRows.filter((item) => {
      const kinds = parseSnapshotMetadata(item.conceptKinds);
      const tags = parseSnapshotMetadata(item.conceptTags);
      const matchesKind = kindFilter === "all" || kinds.includes(kindFilter);
      const matchesText = !query || item.label.toLowerCase().includes(query) || kinds.some((kind) => kind.toLowerCase().includes(query)) || tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesKind && matchesText;
    });
  }, [filterText, kindFilter, snapshotRows]);

  const authorize = async (prompt: string) => { const result = await confirmSensitiveSyncAction(prompt); setStatus(result.message); return result.allowed; };
  const ready = () => { if (!isAuthenticated) { setStatus("Sign in only to use cross-device encrypted version history."); return false; } if (!trusted) { setStatus("Trust this device in Complete-graph sync before managing snapshots."); return false; } if (passphrase.trim().length < 12) { setStatus("Enter the same 12-character minimum sync passphrase used for graph recovery."); return false; } return true; };
  const saveNow = async () => {
    if (!ready() || !(await authorize("Confirm encrypted snapshot creation"))) return;
    try {
      const envelope = JSON.stringify(await encryptCompleteGraph(allConcepts, allConnections, passphrase));
      const conceptKinds = JSON.stringify([...new Set(allConcepts.map((concept) => concept.kind))].sort());
      const conceptTags = JSON.stringify([...new Set(allConcepts.flatMap((concept) => concept.tags))].sort());
      const result = await create.mutateAsync({ deviceId, id: `snapshot-${Date.now()}`, sourceRevision: graphRemote.data?.revision ?? 1, label: label.trim() || "Manual recovery point", envelope, conceptCount: allConcepts.length, relationshipCount: allConnections.length, conceptKinds, conceptTags });
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "snapshot-created", scope: "complete-graph", deviceId, summary: "Encrypted graph snapshot created", metadata: { concepts: allConcepts.length, relationships: allConnections.length, retained: result.retained } });
      setPassphrase(""); await snapshots.refetch(); setStatus(`Encrypted snapshot saved. Up to ten recent revisions are retained.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to create the encrypted snapshot."); }
  };
  const previewSnapshot = async () => {
    if (!selectedId || !ready()) return;
    const response = await selected.refetch();
    if (!response.data) { setStatus("That snapshot is no longer available."); return; }
    try {
      const graph = await decryptCompleteGraph(response.data.envelope, passphrase);
      setDiff(compareSnapshotWithLocal(localGraph, graph));
      setStatus("Snapshot decrypted locally. Review the changes before choosing rollback.");
      setPassphrase("");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to decrypt that snapshot for review."); }
  };
  const restore = async () => {
    if (!selectedId || !ready() || !(await authorize("Confirm encrypted snapshot rollback"))) return;
    const response = await selected.refetch();
    if (!response.data) { setStatus("That snapshot is no longer available."); return; }
    try {
      const graph = await decryptCompleteGraph(response.data.envelope, passphrase);
      replaceGraph(graph.concepts, graph.connections);
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "snapshot-restored", scope: "complete-graph", deviceId, summary: "Encrypted graph snapshot restored locally", metadata: { snapshotId: selectedId, concepts: graph.concepts.length, relationships: graph.connections.length } });
      setDiff(null); setPassphrase(""); setStatus(`Snapshot restored locally at ${new Date(response.data.createdAt).toLocaleString()}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to decrypt that snapshot safely."); }
  };
  const removeSnapshot = async (id: string) => {
    if (!(await authorize("Confirm encrypted snapshot deletion"))) return;
    try { await remove.mutateAsync({ deviceId, id }); if (selectedId === id) setSelectedId(""); await snapshots.refetch(); setStatus("Encrypted snapshot removed. The current local graph was not changed."); } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to remove that snapshot."); }
  };

  if (!isAuthenticated) return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><View style={styles.content}><Header /><View style={styles.signIn}><Text style={styles.sectionTitle}>Encrypted version history</Text><Text style={styles.body}>Local graph work remains available without login. Sign in only to retain opaque rollback points across trusted devices.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Sign in to enable snapshots</Text></Pressable></View></View></ScreenContainer>;

  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><FlatList data={filteredSnapshots} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View><Header /><View style={styles.hero}><Text style={styles.heroTitle}>Opaque remote history</Text><Text style={styles.heroText}>Each snapshot is encrypted before upload. The server retains metadata needed for a review list, but not graph plaintext or the passphrase.</Text></View><View style={styles.form}><Text style={styles.sectionTitle}>CREATE A RECOVERY POINT</Text><TextInput value={label} onChangeText={setLabel} style={styles.input} placeholder="Snapshot label" placeholderTextColor="#71839F" /><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Sync passphrase" placeholderTextColor="#71839F" /><Pressable onPress={() => void saveNow()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Encrypt current graph</Text></Pressable></View><Text style={styles.status}>{status}</Text><Text style={styles.sectionTitle}>RETAINED SNAPSHOTS</Text><TextInput value={filterText} onChangeText={setFilterText} style={styles.filterInput} placeholder="Search labels, tags, or kinds" placeholderTextColor="#71839F" autoCapitalize="none" autoCorrect={false} /><View style={styles.filterRow}><Pressable onPress={() => setKindFilter("all")} style={({ pressed }) => [styles.filterChip, kindFilter === "all" && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterChipText, kindFilter === "all" && styles.filterChipTextActive]}>All kinds</Text></Pressable>{availableKinds.map((kind) => <Pressable key={kind} onPress={() => setKindFilter(kind)} style={({ pressed }) => [styles.filterChip, kindFilter === kind && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterChipText, kindFilter === kind && styles.filterChipTextActive]}>{kind}</Text></Pressable>)}</View><Text style={styles.filterCount}>{filteredSnapshots.length} of {snapshotRows.length} retained snapshots match</Text></View>} renderItem={({ item }) => <View style={[styles.snapshot, selectedId === item.id && styles.snapshotSelected]}><Pressable onPress={() => setSelectedId(item.id)} style={styles.snapshotMain}><Text style={styles.snapshotTitle}>{item.label}</Text><Text style={styles.snapshotMeta}>{new Date(item.createdAt).toLocaleString()} · revision {item.sourceRevision}</Text><Text style={styles.snapshotMeta}>{item.conceptCount} concepts · {item.relationshipCount} relationships</Text></Pressable><Pressable onPress={() => void removeSnapshot(item.id)} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><Text style={styles.deleteText}>Remove</Text></Pressable></View>} ListFooterComponent={selectedId ? <View style={styles.restoreCard}><Text style={styles.restoreTitle}>Selected recovery point</Text><Text style={styles.body}>Rollback replaces the local graph after biometric confirmation. Create a current snapshot first if you want an easy return point.</Text><Pressable onPress={() => void previewSnapshot()} style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}><Text style={styles.previewButtonText}>Decrypt & compare changes</Text></Pressable>{diff ? <SnapshotDiffPanel diff={diff} /> : null}<Pressable onPress={() => void restore()} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={styles.restoreButtonText}>Confirm decrypt & restore locally</Text></Pressable></View> : <Text style={styles.footer}>Select a retained snapshot to review its rollback action.</Text>} /></ScreenContainer>;
}

function parseSnapshotMetadata(raw: string | null | undefined): string[] { try { const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []; } catch { return []; } }

function SnapshotDiffPanel({ diff }: { diff: SnapshotDiffResult }) { return <View style={styles.diffPanel}><Text style={styles.diffEyebrow}>LOCAL VS SNAPSHOT</Text><View style={styles.diffGrid}><DiffMetric label="Concepts" value={`${diff.localConceptsCount} → ${diff.snapshotConceptsCount}`} /><DiffMetric label="New" value={`${diff.newConceptIds.length}`} /><DiffMetric label="Removed" value={`${diff.removedConceptIds.length}`} /><DiffMetric label="Modified" value={`${diff.modifiedConceptIds.length}`} /></View><View style={styles.diffGrid}><DiffMetric label="Relationships" value={`${diff.localConnectionsCount} → ${diff.snapshotConnectionsCount}`} /><DiffMetric label="New links" value={`${diff.newConnectionIds.length}`} /><DiffMetric label="Removed links" value={`${diff.removedConnectionIds.length}`} /></View><Text style={styles.diffNote}>The comparison is performed after local decryption. No graph plaintext is sent to the server.</Text></View>; }
function DiffMetric({ label, value }: { label: string; value: string }) { return <View style={styles.diffMetric}><Text style={styles.diffValue}>{value}</Text><Text style={styles.diffLabel}>{label}</Text></View>; }

function Header() { return <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>ENCRYPTED HISTORY</Text><Text style={styles.title}>Version snapshots</Text></View></View>; }

const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 }, nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, hero: { borderRadius: 17, padding: 15, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, heroTitle: { color: "#ECEAFF", fontSize: 14, fontWeight: "900" }, heroText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, form: { borderRadius: 16, marginTop: 10, padding: 13, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" }, sectionTitle: { color: "#F3F6FC", fontSize: 12, fontWeight: "900", marginTop: 15, marginBottom: 7 }, input: { minHeight: 42, borderRadius: 10, paddingHorizontal: 11, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 12, marginTop: 7 }, primary: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 10, marginTop: 10 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", textAlign: "center" }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, filterInput: { minHeight: 40, borderRadius: 10, paddingHorizontal: 11, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 11, marginTop: 7 }, filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }, filterChip: { minHeight: 29, borderRadius: 8, paddingHorizontal: 9, justifyContent: "center", backgroundColor: "#172238", borderWidth: 1, borderColor: "#334560" }, filterChipActive: { backgroundColor: "#322D67", borderColor: "#7C6CFF" }, filterChipText: { color: "#8FA0B8", fontSize: 9, fontWeight: "800" }, filterChipTextActive: { color: "#E5E0FF" }, filterCount: { color: "#7586A1", fontSize: 9, marginTop: 7 }, snapshot: { minHeight: 83, borderRadius: 14, padding: 11, marginBottom: 7, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560", flexDirection: "row", alignItems: "center", gap: 7 }, snapshotSelected: { borderColor: "#7C6CFF", backgroundColor: "#1C2348" }, snapshotMain: { flex: 1 }, snapshotTitle: { color: "#EAF0FA", fontSize: 11, fontWeight: "900" }, snapshotMeta: { color: "#90A1BA", fontSize: 9, marginTop: 4 }, delete: { minHeight: 30, borderRadius: 8, paddingHorizontal: 8, justifyContent: "center", backgroundColor: "#32202D", borderWidth: 1, borderColor: "#93556E" }, deleteText: { color: "#F1B7C5", fontSize: 9, fontWeight: "900" }, restoreCard: { marginTop: 10, padding: 13, borderRadius: 14, backgroundColor: "#221F3A", borderWidth: 1, borderColor: "#5B5599" }, diffPanel: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: "#171D35", borderWidth: 1, borderColor: "#4D5D8D" }, diffEyebrow: { color: "#9DE4EA", fontSize: 9, letterSpacing: 1, fontWeight: "900" }, diffGrid: { flexDirection: "row", gap: 6, marginTop: 9 }, diffMetric: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#202A4A" }, diffValue: { color: "#F1F5FF", fontSize: 11, fontWeight: "900" }, diffLabel: { color: "#8FA0BB", fontSize: 8, marginTop: 3, textAlign: "center" }, diffNote: { color: "#8393AE", fontSize: 9, lineHeight: 14, marginTop: 9 }, previewButton: { minHeight: 40, borderRadius: 10, marginTop: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#245465" }, previewButtonText: { color: "#DDF8FA", fontSize: 10, fontWeight: "900" }, restoreTitle: { color: "#F1EDFF", fontSize: 12, fontWeight: "900" }, restoreButton: { minHeight: 40, borderRadius: 10, marginTop: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#5A50A4" }, restoreButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, footer: { color: "#74839D", fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 14 }, signIn: { marginTop: 10, borderRadius: 16, padding: 14, backgroundColor: "#16323A", borderWidth: 1, borderColor: "#3D7681" }, body: { color: "#A9B7CD", fontSize: 11, lineHeight: 17 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
