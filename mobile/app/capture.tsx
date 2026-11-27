import { Stack, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { conceptKinds, type ConceptKind } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function CaptureScreen() {
  const { addConcept, isReady } = useRelationshipStore();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ConceptKind>("Theory");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = () => {
    if (saving) return;
    if (!title.trim()) {
      setError("Add a concise title before saving.");
      return;
    }
    if (!isReady) {
      setError("Your graph is still loading. Try again in a moment.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // The store write is the save: only report success once addConcept
      // has returned the stored concept. Nothing is shown as "saved" before
      // this point (finding 1: the old screen announced "Saved locally"
      // without writing anything).
      const concept = addConcept({
        title: title.trim(),
        kind,
        note: note.trim(),
      });
      Alert.alert("Saved", `\u201c${concept.title}\u201d is saved in your graph.`, [
        {
          text: "Keep capturing",
          onPress: () => {
            setTitle("");
            setNote("");
            setKind("Theory");
          },
        },
        { text: "View graph", onPress: () => router.replace("/(tabs)/explore") },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save this concept. Nothing was saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel capture"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New concept</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LOCAL CAPTURE</Text>
        <Text style={styles.title}>Give the idea a place to grow.</Text>
        <TextInput
          accessibilityLabel="Concept title"
          value={title}
          onChangeText={setTitle}
          placeholder="Concept title"
          placeholderTextColor="#73809B"
          autoFocus
          style={styles.titleInput}
          returnKeyType="next"
        />
        <Text style={styles.fieldLabel}>WHAT KIND OF IDEA IS IT?</Text>
        <View style={styles.chips}>
          {conceptKinds.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`Kind: ${value}`}
              accessibilityState={{ selected: kind === value }}
              onPress={() => setKind(value)}
              style={({ pressed }) => [
                styles.chip,
                kind === value && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, kind === value && styles.chipTextActive]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Working note"
          value={note}
          onChangeText={setNote}
          placeholder="What do you want to remember about it?"
          placeholderTextColor="#73809B"
          multiline
          textAlignVertical="top"
          style={styles.noteInput}
        />
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <View style={styles.tip}>
          <Text style={styles.tipBadge}>TIP</Text>
          <Text style={styles.tipCopy}>
            After saving, connect this idea to one familiar concept to make it
            easier to find again.
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save concept"
          accessibilityState={{ disabled: saving || !isReady }}
          disabled={saving || !isReady}
          onPress={save}
          style={({ pressed }) => [styles.save, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving…" : "Save concept locally"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 58 },
  header: { height: 52, alignItems: "center", justifyContent: "space-between", flexDirection: "row", paddingHorizontal: 20 },
  cancel: { minWidth: 64, minHeight: 44, justifyContent: "center" },
  cancelText: { color: "#9FA7FF", fontSize: 15, fontWeight: "800" },
  headerTitle: { color: "#F3F6FC", fontSize: 16, fontWeight: "800" },
  headerSpacer: { width: 64 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 35 },
  eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 },
  title: { color: "#F3F6FC", fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6, maxWidth: 290, marginBottom: 30 },
  titleInput: { height: 62, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 17, color: "#F3F6FC", fontSize: 17, fontWeight: "700" },
  fieldLabel: { color: "#7C89A5", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 18, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: "#33405C", backgroundColor: "#151C2E" },
  chipActive: { backgroundColor: "#7C6CFF", borderColor: "#7C6CFF" },
  chipText: { color: "#C9D1E4", fontSize: 13, fontWeight: "800" },
  chipTextActive: { color: "#FFFFFF" },
  noteInput: { height: 164, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", paddingHorizontal: 17, paddingVertical: 16, color: "#E5E9F5", fontSize: 15, lineHeight: 22, marginTop: 14 },
  error: { color: "#FB7994", fontSize: 13, lineHeight: 19, marginTop: 12 },
  tip: { flexDirection: "row", padding: 14, marginTop: 18, borderRadius: 16, backgroundColor: "#131A2D", borderLeftWidth: 3, borderLeftColor: "#FFB86B" },
  tipBadge: { color: "#FFB86B", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginRight: 9, marginTop: 2 },
  tipCopy: { color: "#9CA9C4", flex: 1, fontSize: 13, lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingBottom: 34, paddingTop: 14, borderTopWidth: 1, borderColor: "#202B44" },
  save: { height: 54, backgroundColor: "#7C6CFF", borderRadius: 17, justifyContent: "center", alignItems: "center" },
  saveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
