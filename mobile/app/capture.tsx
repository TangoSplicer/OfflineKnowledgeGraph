import { Stack, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function CaptureScreen() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const save = () => {
    if (!title.trim()) {
      Alert.alert("Name this concept", "Add a concise title before saving it locally.");
      return;
    }
    Alert.alert("Saved locally", `“${title.trim()}” is ready to link from the graph.`, [{ text: "View graph", onPress: () => router.replace("/(tabs)/explore") }]);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        <Text style={styles.headerTitle}>New concept</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LOCAL CAPTURE</Text>
        <Text style={styles.title}>Give the idea a place to grow.</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Concept title" placeholderTextColor="#73809B" autoFocus style={styles.titleInput} returnKeyType="next" />
        <TextInput value={note} onChangeText={setNote} placeholder="What do you want to remember about it?" placeholderTextColor="#73809B" multiline textAlignVertical="top" style={styles.noteInput} />
        <View style={styles.tip}><Text style={styles.tipBadge}>TIP</Text><Text style={styles.tipCopy}>After saving, connect this idea to one familiar concept to make it easier to find again.</Text></View>
      </View>
      <View style={styles.footer}><Pressable onPress={save} style={({ pressed }) => [styles.save, pressed && styles.pressed]}><Text style={styles.saveText}>Save concept locally</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 58 },
  header: { height: 52, alignItems: "center", justifyContent: "space-between", flexDirection: "row", paddingHorizontal: 20 },
  cancel: { minWidth: 64, height: 42, justifyContent: "center" },
  cancelText: { color: "#9FA7FF", fontSize: 15, fontWeight: "800" },
  headerTitle: { color: "#F3F6FC", fontSize: 16, fontWeight: "800" },
  headerSpacer: { width: 64 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 35 },
  eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 },
  title: { color: "#F3F6FC", fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6, maxWidth: 290, marginBottom: 30 },
  titleInput: { height: 62, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#3C4964", paddingHorizontal: 17, color: "#F3F6FC", fontSize: 17, fontWeight: "700" },
  noteInput: { height: 164, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", paddingHorizontal: 17, paddingVertical: 16, color: "#E5E9F5", fontSize: 15, lineHeight: 22, marginTop: 14 },
  tip: { flexDirection: "row", padding: 14, marginTop: 18, borderRadius: 16, backgroundColor: "#131A2D", borderLeftWidth: 3, borderLeftColor: "#FFB86B" },
  tipBadge: { color: "#FFB86B", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginRight: 9, marginTop: 2 },
  tipCopy: { color: "#9CA9C4", flex: 1, fontSize: 12, lineHeight: 17 },
  footer: { paddingHorizontal: 20, paddingBottom: 34, paddingTop: 14, borderTopWidth: 1, borderColor: "#202B44" },
  save: { height: 54, backgroundColor: "#7C6CFF", borderRadius: 17, justifyContent: "center", alignItems: "center" },
  saveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
