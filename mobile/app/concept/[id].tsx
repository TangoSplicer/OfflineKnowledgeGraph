import { Stack, router, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ConceptRow } from "@/components/concept-row";
import { findConcept } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function ConceptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concepts: graphConcepts, relationshipsFor } = useRelationshipStore();
  const concept = graphConcepts.find((candidate) => candidate.id === id) ?? findConcept(id ?? "adaptive-systems");
  const relationships = relationshipsFor(concept.id);
  const related = relationships.map(({ otherConcept }) => otherConcept);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={related}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.nav}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}><Text style={styles.back}>‹</Text></Pressable>
              <Pressable onPress={() => router.push("/capture")} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}><Text style={styles.editText}>Edit</Text></Pressable>
            </View>
            <View style={[styles.kindBadge, { borderColor: concept.color }]}><View style={[styles.kindDot, { backgroundColor: concept.color }]} /><Text style={styles.kindText}>{concept.kind.toUpperCase()}</Text></View>
            <Text style={styles.title}>{concept.title}</Text>
            <Text style={styles.summary}>{concept.summary}</Text>
            <View style={styles.statRow}><Stat value={`${concept.backlinks}`} label="Backlinks" /><View style={styles.statDivider} /><Stat value={`${relationships.length}`} label="Connections" /><View style={styles.statDivider} /><Stat value="Local" label="Storage" /></View>
            <View style={styles.noteCard}><Text style={styles.noteLabel}>WORKING NOTE</Text><Text style={styles.note}>{concept.note}</Text><Text style={styles.noteMeta}>{concept.updatedAt}</Text></View>
            <View style={styles.actionRow}><Pressable onPress={() => router.push("/(tabs)/explore")} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><Text style={styles.primaryActionText}>View in graph</Text></Pressable><Pressable onPress={() => router.push({ pathname: "/concept/[id]/relationships", params: { id: concept.id } })} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text style={styles.secondaryActionText}>Manage</Text></Pressable></View>
            <Text style={styles.sectionLabel}>RELATED CONCEPTS · {relationships.length}</Text>
          </View>
        }
        renderItem={({ item }) => <ConceptRow concept={item} onPress={() => router.replace(`/concept/${item.id}`)} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No local relationships yet. Use Manage to add one.</Text>}
      />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 },
  content: { paddingHorizontal: 20, paddingBottom: 54 },
  nav: { height: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  roundButton: { width: 42, height: 42, justifyContent: "center", alignItems: "center", borderRadius: 21, backgroundColor: "#151C2E" },
  back: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 },
  editButton: { height: 42, paddingHorizontal: 16, justifyContent: "center", borderRadius: 21, backgroundColor: "#1D2143" },
  editText: { color: "#B7B0FF", fontSize: 14, fontWeight: "800" },
  kindBadge: { alignSelf: "flex-start", height: 30, paddingHorizontal: 11, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", marginBottom: 14, backgroundColor: "#141B2D" },
  kindDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  kindText: { color: "#C9D1E4", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  title: { color: "#F3F6FC", fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  summary: { color: "#B4C0D6", fontSize: 16, lineHeight: 24, marginTop: 11 },
  statRow: { height: 69, borderRadius: 18, backgroundColor: "#151C2E", borderColor: "#26314B", borderWidth: 1, marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  statLabel: { color: "#8E9BB5", fontSize: 11, fontWeight: "600", marginTop: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: "#2A3652" },
  noteCard: { borderRadius: 22, backgroundColor: "#11192B", padding: 18, marginTop: 16, borderWidth: 1, borderColor: "#293551" },
  noteLabel: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.2, fontWeight: "900", marginBottom: 9 },
  note: { color: "#E5EAF5", fontSize: 15, lineHeight: 23 },
  noteMeta: { color: "#7D8AA5", fontSize: 11, fontWeight: "600", marginTop: 13 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 25 },
  primaryAction: { flex: 1, height: 48, borderRadius: 15, justifyContent: "center", alignItems: "center", backgroundColor: "#7C6CFF" },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryAction: { minWidth: 88, height: 48, borderRadius: 15, justifyContent: "center", alignItems: "center", backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#33405C" },
  secondaryActionText: { color: "#E3E8F4", fontSize: 14, fontWeight: "800" },
  sectionLabel: { color: "#7C89A5", fontSize: 11, letterSpacing: 1.2, fontWeight: "800", marginBottom: 10 },
  emptyText: { color: "#8D9BB4", fontSize: 13, lineHeight: 20, paddingVertical: 8 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
