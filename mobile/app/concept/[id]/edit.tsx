import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { conceptKinds, findConcept, type ConceptKind } from "@/lib/knowledge-data";
import { conceptTagsFromText, conceptTagsToText } from "@/lib/concept-tags";
import { sourceUrlsFromText, sourceUrlsToText } from "@/lib/source-references";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function EditConceptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concepts, isReady, updateConcept } = useRelationshipStore();
  const concept = concepts.find((candidate) => candidate.id === id) ?? findConcept(id ?? "adaptive-systems");
  const [title, setTitle] = useState(concept.title);
  const [kind, setKind] = useState<ConceptKind>(concept.kind);
  const [summary, setSummary] = useState(concept.summary);
  const [note, setNote] = useState(concept.note);
  const [tags, setTags] = useState(conceptTagsToText(concept.tags));
  const [sourceUrls, setSourceUrls] = useState(sourceUrlsToText(concept.sourceUrls));
  const [sourceAnnotation, setSourceAnnotation] = useState(concept.sourceAnnotation ?? "");
  const [sourceQuote, setSourceQuote] = useState(concept.sourceQuote ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(concept.title); setKind(concept.kind); setSummary(concept.summary); setNote(concept.note);
    setTags(conceptTagsToText(concept.tags)); setSourceUrls(sourceUrlsToText(concept.sourceUrls));
    setSourceAnnotation(concept.sourceAnnotation ?? ""); setSourceQuote(concept.sourceQuote ?? "");
  }, [concept.id, concept.title, concept.kind, concept.summary, concept.note, concept.tags, concept.sourceUrls, concept.sourceAnnotation, concept.sourceQuote]);

  const save = () => {
    if (!title.trim()) { setError("Give this concept a title before saving."); return; }
    if (!summary.trim()) { setError("Add a short summary so the concept is easy to recognize."); return; }
    const normalizedSources = sourceUrlsFromText(sourceUrls);
    if (sourceUrls.trim() && !normalizedSources.length) { setError("Use a complete http:// or https:// source URL."); return; }
    updateConcept(concept.id, { title, kind, summary, note, tags: conceptTagsFromText(tags), sourceUrls: normalizedSources, sourceAnnotation, sourceQuote });
    router.back();
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>CONCEPT DETAILS</Text><Text style={styles.headerTitle}>Edit concept</Text></View><View style={styles.headerSpace} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Keep the idea clear.</Text><Text style={styles.description}>Refine how this concept appears throughout your local graph. Its existing relationships will stay connected.</Text>
      <Text style={styles.fieldLabel}>TITLE</Text><TextInput value={title} onChangeText={setTitle} autoFocus returnKeyType="next" placeholder="Name this idea" placeholderTextColor="#71809A" style={styles.titleInput} />
      <Text style={styles.fieldLabel}>KIND</Text><View style={styles.chips}>{conceptKinds.map((value) => <Pressable key={value} onPress={() => setKind(value)} style={({ pressed }) => [styles.chip, kind === value && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, kind === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View>
      <Text style={styles.fieldLabel}>TAGS</Text><TextInput value={tags} onChangeText={setTags} placeholder="e.g. systems, research, methods" placeholderTextColor="#71809A" style={styles.tagsInput} /><Text style={styles.hint}>Comma-separated tags create focused graph views.</Text>
      <View style={styles.sourceSection}><Text style={styles.sectionEyebrow}>SOURCE CONTEXT</Text><Text style={styles.sectionTitle}>Make the evidence traceable</Text><Text style={styles.sectionText}>Add a link, your own reading note, and a short quotation. Everything remains stored only on this device.</Text><Text style={styles.fieldLabel}>SOURCE LINKS</Text><TextInput value={sourceUrls} onChangeText={setSourceUrls} multiline autoCapitalize="none" autoCorrect={false} textAlignVertical="top" placeholder="One full https:// URL per line" placeholderTextColor="#71809A" style={styles.sourcesInput} /><Text style={styles.hint}>Links appear as tappable references on this concept.</Text><Text style={styles.fieldLabel}>YOUR ANNOTATION</Text><TextInput value={sourceAnnotation} onChangeText={setSourceAnnotation} multiline maxLength={900} textAlignVertical="top" placeholder="Why does this source matter to this idea?" placeholderTextColor="#71809A" style={styles.contextInput} /><Text style={styles.fieldLabel}>KEY QUOTATION</Text><TextInput value={sourceQuote} onChangeText={setSourceQuote} multiline maxLength={1200} textAlignVertical="top" placeholder="A short passage worth keeping with this concept" placeholderTextColor="#71809A" style={styles.quoteInput} /></View>
      <Text style={styles.fieldLabel}>SHORT SUMMARY</Text><TextInput value={summary} onChangeText={setSummary} multiline textAlignVertical="top" placeholder="A concise description of this concept" placeholderTextColor="#71809A" style={styles.summaryInput} />
      <Text style={styles.fieldLabel}>WORKING NOTE</Text><TextInput value={note} onChangeText={setNote} multiline textAlignVertical="top" placeholder="What you want to remember or explore" placeholderTextColor="#71809A" style={styles.noteInput} />{error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
    <View style={styles.footer}><Pressable disabled={!isReady} onPress={save} style={({ pressed }) => [styles.primary, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.primaryText}>Save concept</Text><Text style={styles.arrow}>→</Text></Pressable></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 }, header: { height: 57, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 12 }, backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#151C2E", alignItems: "center", justifyContent: "center" }, backText: { color: "#F3F6FC", fontSize: 32, lineHeight: 34, marginTop: -3 }, eyebrow: { color: "#48D6E8", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, headerTitle: { color: "#EAF0FC", fontSize: 14, fontWeight: "900", marginTop: 2 }, headerSpace: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30 }, title: { color: "#F3F6FC", fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 }, description: { color: "#A8B5CB", fontSize: 14, lineHeight: 21, marginTop: 9 }, fieldLabel: { color: "#71809A", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginTop: 19, marginBottom: 8 }, titleInput: { height: 55, borderRadius: 15, paddingHorizontal: 15, color: "#F3F6FC", fontSize: 16, fontWeight: "800", backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { minHeight: 37, paddingHorizontal: 12, borderRadius: 11, justifyContent: "center", backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#31415F" }, chipActive: { backgroundColor: "#332E75", borderColor: "#8B81FA" }, chipText: { color: "#AAB6C9", fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#F0EEFF" }, tagsInput: { height: 50, borderRadius: 15, paddingHorizontal: 15, color: "#C8F2EF", fontSize: 13, fontWeight: "700", backgroundColor: "#122A35", borderWidth: 1, borderColor: "#3B7281" }, hint: { color: "#7EA9B6", fontSize: 10, lineHeight: 15, marginTop: 6 }, sourceSection: { borderRadius: 20, padding: 15, marginTop: 24, backgroundColor: "#102033", borderWidth: 1, borderColor: "#335B79" }, sectionEyebrow: { color: "#65D8E4", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, sectionTitle: { color: "#E4F4FA", fontSize: 16, fontWeight: "900", marginTop: 5 }, sectionText: { color: "#91B7C8", fontSize: 11, lineHeight: 17, marginTop: 5 }, sourcesInput: { minHeight: 78, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, color: "#C8E4FA", fontSize: 12, lineHeight: 18, backgroundColor: "#132235", borderWidth: 1, borderColor: "#416184" }, contextInput: { minHeight: 86, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, color: "#D9ECF6", fontSize: 12, lineHeight: 18, backgroundColor: "#132235", borderWidth: 1, borderColor: "#416184" }, quoteInput: { minHeight: 96, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, color: "#D3F0EE", fontSize: 12, lineHeight: 18, backgroundColor: "#143033", borderWidth: 1, borderColor: "#3A7480" }, summaryInput: { minHeight: 104, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 13, color: "#E8EDF8", fontSize: 14, lineHeight: 21, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964" }, noteInput: { minHeight: 148, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 13, color: "#E8EDF8", fontSize: 14, lineHeight: 21, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964" }, error: { color: "#FF9EAE", fontSize: 12, fontWeight: "700", marginTop: 12 }, footer: { borderTopWidth: 1, borderColor: "#202B44", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, primary: { height: 53, borderRadius: 16, backgroundColor: "#7C6CFF", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, arrow: { color: "#FFFFFF", fontSize: 21 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.45 },
});
