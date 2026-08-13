import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { conceptKinds, relationshipTypes, type ConceptKind, type RelationshipType } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

export const FIRST_CONCEPT_WIZARD_KEY = "offline-knowledge-graph.first-concept-wizard.v1";

type WizardStep = 1 | 2 | 3;

export default function FirstConceptWizardScreen() {
  const { concepts, isReady, addConcept, addRelationship } = useRelationshipStore();
  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ConceptKind>("Theory");
  const [note, setNote] = useState("");
  const [createdConceptId, setCreatedConceptId] = useState<string | null>(null);
  const [companionTitle, setCompanionTitle] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<RelationshipType>("supports");
  const [error, setError] = useState("");

  const availableTargets = useMemo(() => concepts.filter((concept) => concept.id !== createdConceptId), [concepts, createdConceptId]);
  const currentStepLabel = step === 1 ? "Name the idea" : step === 2 ? "Give it context" : "Make one connection";
  const progress = `${step} of 3`;

  const skip = async () => {
    await AsyncStorage.setItem(FIRST_CONCEPT_WIZARD_KEY, "skipped");
    router.replace("/(tabs)");
  };

  const goToNote = () => {
    if (!title.trim()) {
      setError("Give your concept a short name to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const createFirstConcept = () => {
    if (!note.trim()) {
      setError("Add one sentence so your future self knows why this idea matters.");
      return;
    }
    if (!isReady) return;
    const concept = addConcept({ title: title.trim(), kind, note: note.trim() });
    setCreatedConceptId(concept.id);
    setError("");
    setStep(3);
  };

  const finish = async (withConnection: boolean) => {
    if (!createdConceptId) return;
    let nextTargetId = targetId;
    if (withConnection && !nextTargetId && companionTitle.trim()) {
      const companion = addConcept({ title: companionTitle.trim(), kind: "Question", note: `A companion idea connected to ${title.trim()}.` });
      nextTargetId = companion.id;
    }
    if (withConnection && nextTargetId) {
      addRelationship({ sourceId: createdConceptId, targetId: nextTargetId, relationship, strength: 3, note: "First connection created during the guided start." });
    }
    await AsyncStorage.setItem(FIRST_CONCEPT_WIZARD_KEY, withConnection && nextTargetId ? "completed-with-connection" : "completed");
    router.replace(withConnection && nextTargetId ? "/(tabs)/explore" : `/concept/${createdConceptId}`);
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={styles.topbar}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.progressCopy}><Text style={styles.progressLabel}>FIRST CONCEPT</Text><Text style={styles.progressStep}>{progress}</Text></View><Pressable onPress={skip} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}><Text style={styles.skipText}>Skip</Text></Pressable></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>{currentStepLabel.toUpperCase()}</Text>
      {step === 1 ? <StepOne title={title} setTitle={setTitle} kind={kind} setKind={setKind} /> : null}
      {step === 2 ? <StepTwo title={title} note={note} setNote={setNote} /> : null}
      {step === 3 ? <StepThree title={title} availableTargets={availableTargets} targetId={targetId} setTargetId={setTargetId} companionTitle={companionTitle} setCompanionTitle={setCompanionTitle} relationship={relationship} setRelationship={setRelationship} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
    <View style={styles.footer}>{step === 1 ? <PrimaryButton label="Continue to the note" onPress={goToNote} /> : null}{step === 2 ? <PrimaryButton label="Create this concept" onPress={createFirstConcept} disabled={!isReady} /> : null}{step === 3 ? <><PrimaryButton label={targetId || companionTitle.trim() ? "Create connection" : "Finish without a connection"} onPress={() => finish(Boolean(targetId || companionTitle.trim()))} /><Pressable onPress={() => finish(false)} style={({ pressed }) => [styles.laterButton, pressed && styles.pressed]}><Text style={styles.laterText}>I’ll connect it later</Text></Pressable></> : null}</View>
  </KeyboardAvoidingView>;
}

function StepOne({ title, setTitle, kind, setKind }: { title: string; setTitle: (value: string) => void; kind: ConceptKind; setKind: (value: ConceptKind) => void }) {
  return <View><Text style={styles.title}>What idea do you want to keep close?</Text><Text style={styles.description}>Start with a phrase you expect to revisit. It can be rough; the graph will help it become clearer.</Text><TextInput value={title} onChangeText={setTitle} placeholder="e.g. Decision fatigue" placeholderTextColor="#71809A" autoFocus style={styles.titleInput} returnKeyType="next" /><Text style={styles.fieldLabel}>WHAT KIND OF IDEA IS IT?</Text><View style={styles.chips}>{conceptKinds.map((value) => <Pressable key={value} onPress={() => setKind(value)} style={({ pressed }) => [styles.chip, kind === value && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, kind === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View><HelperCard title="Keep it simple" detail="A useful concept can begin as a question, a pattern, a person, or a method." /></View>;
}

function StepTwo({ title, note, setNote }: { title: string; note: string; setNote: (value: string) => void }) {
  return <View><Text style={styles.title}>Why does {title || "this idea"} matter?</Text><Text style={styles.description}>Write one working sentence. You can always expand it later from the concept detail screen.</Text><TextInput value={note} onChangeText={setNote} placeholder="I want to remember that…" placeholderTextColor="#71809A" multiline textAlignVertical="top" autoFocus style={styles.noteInput} /><View style={styles.promptList}><Text style={styles.promptTitle}>Try finishing one of these:</Text><Text style={styles.prompt}>“This helps me notice…”</Text><Text style={styles.prompt}>“I’m still unsure about…”</Text><Text style={styles.prompt}>“This connects to…”</Text></View></View>;
}

function StepThree({ title, availableTargets, targetId, setTargetId, companionTitle, setCompanionTitle, relationship, setRelationship }: { title: string; availableTargets: Array<{ id: string; title: string; kind: string; color: string }>; targetId: string | null; setTargetId: (value: string | null) => void; companionTitle: string; setCompanionTitle: (value: string) => void; relationship: RelationshipType; setRelationship: (value: RelationshipType) => void }) {
  return <View><Text style={styles.title}>Give {title} a neighbor.</Text><Text style={styles.description}>One thoughtful connection is enough to make a concept easier to find and remember.</Text>{availableTargets.length ? <><Text style={styles.fieldLabel}>CONNECT TO AN EXISTING CONCEPT</Text><View style={styles.targetList}>{availableTargets.slice(0, 6).map((target) => <Pressable key={target.id} onPress={() => setTargetId(target.id)} style={({ pressed }) => [styles.target, targetId === target.id && styles.targetActive, pressed && styles.pressed]}><View style={[styles.targetDot, { backgroundColor: target.color }]} /><Text style={[styles.targetText, targetId === target.id && styles.targetTextActive]}>{target.title}</Text><Text style={styles.targetKind}>{target.kind}</Text></Pressable>)}</View></> : <><Text style={styles.fieldLabel}>CREATE A COMPANION CONCEPT</Text><TextInput value={companionTitle} onChangeText={(value) => { setCompanionTitle(value); setTargetId(null); }} placeholder="e.g. A question to explore next" placeholderTextColor="#71809A" style={styles.companionInput} /></>}<Text style={styles.fieldLabel}>HOW DOES IT RELATE?</Text><View style={styles.chips}>{relationshipTypes.map((value) => <Pressable key={value} onPress={() => setRelationship(value)} style={({ pressed }) => [styles.chip, relationship === value && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, relationship === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View><HelperCard title="No pressure" detail="You can finish now and add a connection whenever the relationship becomes clearer." /></View>;
}

function HelperCard({ title, detail }: { title: string; detail: string }) { return <View style={styles.helper}><Text style={styles.helperBadge}>GUIDE</Text><View style={styles.helperCopy}><Text style={styles.helperTitle}>{title}</Text><Text style={styles.helperDetail}>{detail}</Text></View></View>; }
function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}><Text style={styles.primaryButtonText}>{label}</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 }, topbar: { height: 53, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" }, backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 }, progressCopy: { alignItems: "center" }, progressLabel: { color: "#48D6E8", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, progressStep: { color: "#8F9DB7", fontSize: 11, fontWeight: "700", marginTop: 3 }, skipButton: { minWidth: 40, height: 40, justifyContent: "center", alignItems: "flex-end" }, skipText: { color: "#A9A0FF", fontSize: 13, fontWeight: "800" }, progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, backgroundColor: "#202B44", overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#7C6CFF" }, content: { paddingHorizontal: 24, paddingTop: 34, paddingBottom: 34 }, eyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.2, fontWeight: "900", marginBottom: 9 }, title: { color: "#F3F6FC", fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.7 }, description: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 24 }, titleInput: { height: 61, borderRadius: 16, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 16, color: "#F3F6FC", fontSize: 17, fontWeight: "700" }, fieldLabel: { color: "#71809A", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginTop: 24, marginBottom: 9 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { minHeight: 37, paddingHorizontal: 12, borderRadius: 11, justifyContent: "center", backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#31415F" }, chipActive: { backgroundColor: "#332E75", borderColor: "#8B81FA" }, chipText: { color: "#AAB6C9", fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#F0EEFF" }, noteInput: { minHeight: 166, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 16, paddingVertical: 15, color: "#E8EDF8", fontSize: 15, lineHeight: 22 }, promptList: { marginTop: 22, borderTopWidth: 1, borderColor: "#202B44", paddingTop: 14 }, promptTitle: { color: "#7D8AA5", fontSize: 10, letterSpacing: 0.8, fontWeight: "900", marginBottom: 8 }, prompt: { color: "#AAB6C9", fontSize: 13, lineHeight: 23 }, helper: { flexDirection: "row", padding: 14, marginTop: 24, borderRadius: 16, backgroundColor: "#131A2D", borderLeftWidth: 3, borderLeftColor: "#FFB86B" }, helperBadge: { color: "#FFB86B", fontSize: 9, letterSpacing: 0.8, fontWeight: "900", marginRight: 9, marginTop: 2 }, helperCopy: { flex: 1 }, helperTitle: { color: "#E7ECF7", fontSize: 12, fontWeight: "800" }, helperDetail: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 3 }, targetList: { gap: 7 }, target: { minHeight: 48, borderRadius: 12, backgroundColor: "#172137", borderWidth: 1, borderColor: "#2D3A57", paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }, targetActive: { backgroundColor: "#27235A", borderColor: "#8A80F3" }, targetDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 }, targetText: { flex: 1, color: "#DDE4F0", fontSize: 13, fontWeight: "800" }, targetTextActive: { color: "#FBFAFF" }, targetKind: { color: "#8795AF", fontSize: 10, fontWeight: "700" }, companionInput: { height: 57, borderRadius: 15, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 15, color: "#F3F6FC", fontSize: 15 }, error: { color: "#FF9EAE", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 14 }, footer: { borderTopWidth: 1, borderColor: "#202B44", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, primaryButton: { height: 54, borderRadius: 16, backgroundColor: "#7C6CFF", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, primaryButtonArrow: { color: "#FFFFFF", fontSize: 21 }, laterButton: { minHeight: 38, justifyContent: "center", alignItems: "center" }, laterText: { color: "#A9A0FF", fontSize: 12, fontWeight: "800" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
