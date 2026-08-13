import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Concept } from "@/lib/knowledge-data";

export function ConceptRow({ concept, onPress }: { concept: Concept; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.mark, { backgroundColor: concept.color }]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{concept.title}</Text>
        <Text style={styles.meta}>{concept.kind} · {concept.backlinks} links</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 70, borderRadius: 18, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#26314B", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 10 },
  pressed: { opacity: 0.72 },
  mark: { width: 10, height: 36, borderRadius: 8, marginRight: 14 },
  copy: { flex: 1 },
  title: { color: "#F3F6FC", fontSize: 16, lineHeight: 21, fontWeight: "700" },
  meta: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 3 },
  chevron: { color: "#9CA9C4", fontSize: 28, lineHeight: 28, marginLeft: 10 },
});
