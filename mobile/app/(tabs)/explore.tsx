import { Stack, router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";

import { ConceptRow } from "@/components/concept-row";
import { GraphCanvas } from "@/components/graph-canvas";
import { ScreenContainer } from "@/components/screen-container";
import { concepts } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

export default function ExploreScreen() {
  const { connections } = useRelationshipStore();
  const [filter, setFilter] = useState<"all" | "noted" | "strong">("all");
  const visibleConnections = useMemo(() => connections.filter((connection) => filter === "all" || (filter === "noted" ? Boolean(connection.note) : connection.strength >= 4)), [connections, filter]);
  const nearbyIds = useMemo(() => new Set(visibleConnections.flatMap((connection) => [connection.sourceId, connection.targetId])), [visibleConnections]);
  const nearbyConcepts = useMemo(() => concepts.filter((concept) => concept.id !== "adaptive-systems" && nearbyIds.has(concept.id)), [nearbyIds]);
  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={nearbyConcepts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.topline}>
              <View>
                <Text style={styles.eyebrow}>SYSTEMS PRACTICE</Text>
                <Text style={styles.title}>Explore connections</Text>
              </View>
              <Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
                <Text style={styles.searchIcon}>⌕</Text>
              </Pressable>
            </View>
            <View style={styles.canvasWrap}>
              <GraphCanvas concepts={concepts} connections={visibleConnections} onSelect={(id) => router.push(`/concept/${id}`)} />
            </View>
            <View style={styles.filters}>
              <Filter label="All links" active={filter === "all"} onPress={() => setFilter("all")} />
              <Filter label="Noted" active={filter === "noted"} onPress={() => setFilter("noted")} />
              <Filter label="Strong" active={filter === "strong"} onPress={() => setFilter("strong")} />
            </View>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Nearest concepts</Text>
              <Text style={styles.sectionMeta}>{visibleConnections.length} links shown</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <ConceptRow concept={item} onPress={() => router.push(`/concept/${item.id}`)} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No connections match this filter. Update links in a concept’s Manage screen.</Text>}
        ListFooterComponent={<Text style={styles.footer}>Relationship edits and notes update this local graph immediately.</Text>}
      />
    </ScreenContainer>
  );
}

function Filter({ label, active = false, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.filter, active && styles.activeFilter, pressed && styles.pressed]}><Text style={[styles.filterText, active && styles.activeFilterText]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 116 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  title: { color: "#F3F6FC", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  searchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151C2E", borderColor: "#2A3652", borderWidth: 1, justifyContent: "center", alignItems: "center" },
  searchIcon: { color: "#F3F6FC", fontSize: 28, marginTop: -4 },
  canvasWrap: { borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "#26314B" },
  filters: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 26 },
  filter: { height: 34, justifyContent: "center", paddingHorizontal: 13, borderRadius: 17, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#293551" },
  activeFilter: { backgroundColor: "#28235A", borderColor: "#7C6CFF" },
  filterText: { color: "#9CA9C4", fontSize: 12, fontWeight: "700" },
  activeFilterText: { color: "#DCD8FF" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800" },
  sectionMeta: { color: "#9CA9C4", fontSize: 12, fontWeight: "600" },
  emptyText: { color: "#91A0B9", fontSize: 13, lineHeight: 20, paddingVertical: 9 },
  footer: { color: "#66738F", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 16 },
  pressed: { opacity: 0.65 },
});
