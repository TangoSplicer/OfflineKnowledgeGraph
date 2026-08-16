import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { defaultFirstRelationshipNote, FIRST_RELATIONSHIP_WIZARD_KEY, validateRelationshipTarget } from "@/lib/first-relationship-state";
import { findConcept, relationshipTypes, type RelationshipType } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function FirstRelationshipWizardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concepts, addConcept, addRelationship } = useRelationshipStore();
  const source = concepts.find((concept) => concept.id === id) ?? findConcept(id ?? "");
  const targets = useMemo(() => concepts.filter((concept) => concept.id !== source.id), [concepts, source.id]);
  const [targetId, setTargetId] = useState<string | null>(targets[0]?.id ?? null);
  const [companionTitle, setCompanionTitle] = useState("");
  const [relationship, setRelationship] = useState<RelationshipType>("supports");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const skip = async () => {
    await AsyncStorage.setItem(FIRST_RELATIONSHIP_WIZARD_KEY, "skipped");
    router.replace(`/concept/${source.id}`);
  };
  const finish = async () => {
    const validationError = validateRelationshipTarget(targetId, companionTitle);
    if (validationError) { setError(validationError); return; }
    let destinationId = targetId;
    if (!destinationId) destinationId = addConcept({ title: companionTitle.trim(), kind: "Question", note: `A companion idea connected to ${source.title}.` }).id;
    addRelationship({ sourceId: source.id, targetId: destinationId, relationship, strength: 3, note: note.trim() || defaultFirstRelationshipNote(relationship) });
    await AsyncStorage.setItem(FIRST_RELATIONSHIP_WIZARD_KEY, "completed");
    router.replace("/(tabs)/explore");
  };

  return <View style={styles.screen}><Stack.Screen options={{ headerShown: false }} /><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.step}>FIRST RELATIONSHIP</Text><Pressable onPress={skip} style={({ pressed }) => [styles.skip, pressed && styles.pressed]}><Text style={styles.skipText}>Later</Text></Pressable></View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>CONNECT YOUR FIRST IDEA</Text><Text style={styles.title}>Give {source.title} a useful neighbor.</Text><Text style={styles.description}>A relationship is a short explanation of how two ideas help each other make sense.</Text>{targets.length ? <><Text style={styles.fieldLabel}>CONNECT TO A CONCEPT</Text><View style={styles.targetList}>{targets.slice(0, 8).map((target) => <Pressable key={target.id} onPress={() => { setTargetId(target.id); setCompanionTitle(""); }} style={({ pressed }) => [styles.target, targetId === target.id && styles.targetActive, pressed && styles.pressed]}><View style={[styles.dot, { backgroundColor: target.color }]} /><View style={styles.targetCopy}><Text style={styles.targetTitle}>{target.title}</Text><Text style={styles.targetKind}>{target.kind}</Text></View><Text style={styles.selectMark}>{targetId === target.id ? "✓" : ""}</Text></Pressable>)}</View></> : <><Text style={styles.fieldLabel}>ADD A COMPANION IDEA</Text><TextInput value={companionTitle} onChangeText={(value) => { setCompanionTitle(value); setTargetId(null); }} placeholder="e.g. A question to explore next" placeholderTextColor="#71809A" style={styles.input} /></>}<Text style={styles.fieldLabel}>HOW DOES IT RELATE?</Text><View style={styles.chips}>{relationshipTypes.map((value) => <Pressable key={value} onPress={() => setRelationship(value)} style={({ pressed }) => [styles.chip, relationship === value && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, relationship === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>ADD A SHORT NOTE <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput value={note} onChangeText={setNote} placeholder="Why does this connection matter?" placeholderTextColor="#71809A" multiline textAlignVertical="top" style={styles.noteInput} />{error ? <Text style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.footer}><Pressable onPress={finish} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Create relationship</Text><Text style={styles.arrow}>→</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 }, header: { height: 54, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" }, backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 }, step: { color: "#48D6E8", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, skip: { minWidth: 40, alignItems: "flex-end" }, skipText: { color: "#B9B2FF", fontSize: 13, fontWeight: "800" }, content: { padding: 24, paddingBottom: 28 }, eyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.2, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", marginTop: 8 }, description: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 10 }, fieldLabel: { color: "#71809A", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginTop: 23, marginBottom: 9 }, optional: { color: "#8291AB" }, targetList: { gap: 7 }, target: { minHeight: 54, borderRadius: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#172137", borderWidth: 1, borderColor: "#30405D" }, targetActive: { borderColor: "#8C81F7", backgroundColor: "#28235D" }, dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 }, targetCopy: { flex: 1 }, targetTitle: { color: "#E7EDF8", fontSize: 13, fontWeight: "800" }, targetKind: { color: "#91A0B9", fontSize: 10, marginTop: 2 }, selectMark: { color: "#91E5C0", fontSize: 16, fontWeight: "900" }, input: { height: 55, borderRadius: 14, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 14, color: "#F3F6FC", fontSize: 14 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { minHeight: 36, borderRadius: 10, paddingHorizontal: 11, justifyContent: "center", backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#31415F" }, chipActive: { backgroundColor: "#332E75", borderColor: "#8B81FA" }, chipText: { color: "#AAB6C9", fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#F0EEFF" }, noteInput: { minHeight: 105, borderRadius: 15, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", padding: 14, color: "#E8EDF8", fontSize: 14, lineHeight: 21 }, error: { color: "#FF9EAE", fontSize: 12, fontWeight: "700", marginTop: 12 }, footer: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 30, borderTopWidth: 1, borderColor: "#202B44" }, primary: { minHeight: 53, borderRadius: 16, backgroundColor: "#7C6CFF", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, arrow: { color: "#FFFFFF", fontSize: 21 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
