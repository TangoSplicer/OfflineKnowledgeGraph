import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { saveScheduledBackupPassphrase } from "@/lib/backup-key";
import { registerEncryptedBackupTask, isEncryptedBackupTaskRegistered, unregisterEncryptedBackupTask } from "@/lib/backup-background-task";
import { runDueEncryptedBackups, loadBackupSchedules, removeBackupSchedule, upsertBackupSchedule } from "@/lib/backup-runner";
import { createBackupSchedule, setBackupScheduleEnabled, type BackupSchedule, type BackupScheduleFrequency } from "@/lib/backup-schedules";
import { appendAndSaveSyncAuditEvent } from "@/lib/sync-audit";

export default function BackupSchedulesScreen() {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [frequency, setFrequency] = useState<BackupScheduleFrequency>("daily");
  const [hour, setHour] = useState(`${new Date().getUTCHours()}`);
  const [weekday, setWeekday] = useState(`${new Date().getUTCDay()}`);
  const [passphrase, setPassphrase] = useState("");
  const [taskRegistered, setTaskRegistered] = useState(false);
  const [status, setStatus] = useState("Schedules run only after you explicitly protect the backup key.");

  const refresh = async () => {
    setSchedules(await loadBackupSchedules());
    try { setTaskRegistered(await isEncryptedBackupTaskRegistered()); } catch { setTaskRegistered(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const authorize = async (prompt: string) => {
    const result = await confirmSensitiveSyncAction(prompt);
    setStatus(result.message);
    return result.allowed;
  };
  const saveSchedule = async () => {
    if (!passphrase.trim()) { setStatus("Enter the user-held passphrase that will protect automatic encrypted backups."); return; }
    if (!(await authorize("Confirm protected automatic backup setup"))) return;
    try {
      const created = createBackupSchedule({ frequency, hourUTC: Number(hour), weekdayUTC: Number(weekday) });
      await saveScheduledBackupPassphrase(passphrase);
      const next = await upsertBackupSchedule(created);
      await registerEncryptedBackupTask();
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: "backup-scheduled", scope: "schedule", summary: "Automatic encrypted backup schedule created", metadata: { scheduleId: created.id, frequency: created.frequency, hourUTC: created.hourUTC, weekdayUTC: created.weekdayUTC } });
      setSchedules(next); setTaskRegistered(true); setPassphrase("");
      setStatus(`Schedule saved. The next run is ${new Date(created.nextRunAt).toUTCString()}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save this backup schedule."); }
  };
  const toggle = async (schedule: BackupSchedule) => {
    if (!(await authorize(schedule.enabled ? "Confirm automatic backup pause" : "Confirm automatic backup resume"))) return;
    try {
      const nextSchedule = setBackupScheduleEnabled(schedule, !schedule.enabled);
      const next = await upsertBackupSchedule(nextSchedule);
      if (next.some((item) => item.enabled)) await registerEncryptedBackupTask(); else await unregisterEncryptedBackupTask();
      await appendAndSaveSyncAuditEvent({ createdAt: new Date().toISOString(), operation: schedule.enabled ? "backup-paused" : "backup-scheduled", scope: "schedule", summary: schedule.enabled ? "Automatic encrypted backups paused" : "Automatic encrypted backups resumed", metadata: { scheduleId: schedule.id, enabled: !schedule.enabled } });
      setSchedules(next); setTaskRegistered(next.some((item) => item.enabled)); setStatus(schedule.enabled ? "Automatic backup paused safely. No remote copy was changed." : "Automatic backup resumed.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to change the backup schedule."); }
  };
  const remove = async (schedule: BackupSchedule) => {
    if (!(await authorize("Confirm automatic backup removal"))) return;
    try { const next = await removeBackupSchedule(schedule.id); if (!next.some((item) => item.enabled)) await unregisterEncryptedBackupTask(); setSchedules(next); setTaskRegistered(next.some((item) => item.enabled)); setStatus("Automatic backup schedule removed."); } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to remove the backup schedule."); }
  };
  const runDue = async () => {
    if (!(await authorize("Confirm due encrypted backup execution"))) return;
    try { const result = await runDueEncryptedBackups(); setSchedules(result.schedules); setStatus(result.attempted ? result.messages.join(" ") || `${result.completed} encrypted backups completed.` : "No backup schedule is due yet."); } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to run due encrypted backups."); }
  };

  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><FlatList data={schedules} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View><View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>LOCAL-FIRST AUTOMATION</Text><Text style={styles.title}>Encrypted backups</Text></View></View><View style={styles.hero}><Text style={styles.heroTitle}>Automatic, but never plaintext</Text><Text style={styles.heroText}>The app stores your passphrase only in the device-protected keychain after explicit confirmation. The server receives the same opaque encrypted graph envelope used by manual sync.</Text><Text style={styles.task}>{taskRegistered ? "BACKGROUND TASK REGISTERED" : "RUNS WHEN THE APP OPENS"}</Text></View><View style={styles.form}><Text style={styles.sectionTitle}>NEW SCHEDULE</Text><Text style={styles.label}>FREQUENCY</Text><View style={styles.segment}><Pressable onPress={() => setFrequency("daily")} style={[styles.segmentButton, frequency === "daily" && styles.segmentSelected]}><Text style={styles.segmentText}>Daily</Text></Pressable><Pressable onPress={() => setFrequency("weekly")} style={[styles.segmentButton, frequency === "weekly" && styles.segmentSelected]}><Text style={styles.segmentText}>Weekly</Text></Pressable></View><Text style={styles.label}>UTC HOUR (0–23)</Text><TextInput value={hour} onChangeText={setHour} keyboardType="number-pad" style={styles.input} placeholder="9" placeholderTextColor="#71839F" /><Text style={styles.label}>WEEKDAY (0 SUN · 6 SAT)</Text><TextInput value={weekday} onChangeText={setWeekday} keyboardType="number-pad" style={styles.input} placeholder="1" placeholderTextColor="#71839F" /><Text style={styles.label}>USER-HELD PASSPHRASE</Text><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="At least 12 characters" placeholderTextColor="#71839F" /><Pressable onPress={() => void saveSchedule()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Protect key & save schedule</Text></Pressable><Pressable onPress={() => void runDue()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Run due backups now</Text></Pressable></View><Text style={styles.status}>{status}</Text><Text style={styles.sectionTitle}>SAVED SCHEDULES</Text></View>} renderItem={({ item }) => <View style={styles.schedule}><View style={styles.scheduleCopy}><Text style={styles.scheduleTitle}>{item.frequency === "daily" ? "Daily" : "Weekly"} at {String(item.hourUTC).padStart(2, "0")}:00 UTC</Text><Text style={styles.scheduleMeta}>{item.enabled ? "Active" : "Paused"} · next {new Date(item.nextRunAt).toLocaleString()}</Text>{item.lastError ? <Text style={styles.error}>{item.lastError}</Text> : null}</View><View style={styles.scheduleActions}><Pressable onPress={() => void toggle(item)} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}><Text style={styles.smallActionText}>{item.enabled ? "Pause" : "Resume"}</Text></Pressable><Pressable onPress={() => void remove(item)} style={({ pressed }) => [styles.smallDelete, pressed && styles.pressed]}><Text style={styles.smallDeleteText}>Remove</Text></Pressable></View></View>} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No automatic backups yet.</Text><Text style={styles.body}>Start with one daily or weekly schedule. You can pause it without deleting the remote encrypted graph.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 }, nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, hero: { borderRadius: 17, padding: 15, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, heroTitle: { color: "#ECEAFF", fontSize: 14, fontWeight: "900" }, heroText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, task: { color: "#8EF0C2", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 11 }, form: { borderRadius: 16, marginTop: 10, padding: 13, backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" }, sectionTitle: { color: "#F3F6FC", fontSize: 12, fontWeight: "900", marginTop: 15, marginBottom: 7 }, label: { color: "#8392AE", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 10, marginBottom: 5 }, segment: { flexDirection: "row", gap: 7 }, segmentButton: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#1C2B41", borderWidth: 1, borderColor: "#3A4E6C" }, segmentSelected: { backgroundColor: "#514AA7", borderColor: "#8F85FF" }, segmentText: { color: "#EEF3FC", fontSize: 11, fontWeight: "800" }, input: { minHeight: 42, borderRadius: 10, paddingHorizontal: 11, color: "#EEF3FC", backgroundColor: "#121B2C", borderWidth: 1, borderColor: "#425676", fontSize: 12 }, primary: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 10, marginTop: 12 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", textAlign: "center" }, secondary: { minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#203E4C", borderWidth: 1, borderColor: "#5696A3", marginTop: 8 }, secondaryText: { color: "#C7EEF1", fontSize: 10, fontWeight: "900" }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, schedule: { minHeight: 82, borderRadius: 14, padding: 12, marginBottom: 7, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560", flexDirection: "row", gap: 8 }, scheduleCopy: { flex: 1 }, scheduleTitle: { color: "#EAF0FA", fontSize: 11, fontWeight: "900" }, scheduleMeta: { color: "#90A1BA", fontSize: 9, lineHeight: 14, marginTop: 4 }, error: { color: "#F1B7C5", fontSize: 9, lineHeight: 14, marginTop: 4 }, scheduleActions: { justifyContent: "center", gap: 6 }, smallAction: { minHeight: 29, borderRadius: 8, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#293A5A" }, smallActionText: { color: "#D5DBF0", fontSize: 9, fontWeight: "900" }, smallDelete: { minHeight: 29, borderRadius: 8, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#32202D", borderWidth: 1, borderColor: "#93556E" }, smallDeleteText: { color: "#F1B7C5", fontSize: 9, fontWeight: "900" }, empty: { padding: 15, borderRadius: 14, backgroundColor: "#151D30", borderWidth: 1, borderColor: "#334560" }, emptyTitle: { color: "#EAF0FA", fontSize: 12, fontWeight: "900", marginBottom: 5 }, body: { color: "#A9B7CD", fontSize: 11, lineHeight: 17 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
