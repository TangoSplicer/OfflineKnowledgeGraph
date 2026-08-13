import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { createConceptSearchIndex, searchConceptIndex, type ConceptSearchHit } from "@/lib/full-text-search";
import { concepts } from "@/lib/knowledge-data";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const index = useMemo(() => createConceptSearchIndex(concepts), []);
  const results = useMemo(() => searchConceptIndex(index, query), [index, query]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable>
        <Text style={styles.title}>Search your graph</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Concepts, evidence, questions…" placeholderTextColor="#73809B" autoFocus returnKeyType="done" style={styles.input} />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.concept.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<View style={styles.resultHeader}><Text style={styles.resultLabel}>{query ? `${results.length} ranked concept${results.length === 1 ? "" : "s"}` : "RECENTLY TOUCHED"}</Text>{query ? <Text style={styles.searchDetail}>On-device full-text index</Text> : null}</View>}
        renderItem={({ item }) => <SearchResult hit={item} query={query} onPress={() => router.replace({ pathname: "/concept/[id]", params: { id: item.concept.id } })} />}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No connected concepts yet</Text><Text style={styles.emptyCopy}>Try a broader phrase or create a new local concept.</Text></View>}
      />
    </View>
  );
}

function SearchResult({ hit, query, onPress }: { hit: ConceptSearchHit; query: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
      <View style={[styles.resultMark, { backgroundColor: hit.concept.color }]} />
      <View style={styles.resultCopy}>
        <HighlightText text={hit.concept.title} query={query} style={styles.resultTitle} />
        <Text style={styles.resultSnippet} numberOfLines={2}>{hit.snippet}</Text>
        {query ? <View style={styles.matchRow}>{hit.matchedFields.slice(0, 2).map((field) => <View key={field} style={styles.matchChip}><Text style={styles.matchText}>{field === "note" ? "Working note" : field}</Text></View>)}<Text style={styles.scoreText}>Relevance {Math.min(99, hit.score)}</Text></View> : <Text style={styles.resultMeta}>{hit.concept.kind} · {hit.concept.backlinks} links</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function HighlightText({ text, query, style }: { text: string; query: string; style: object }) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return <Text style={style}>{text}</Text>;
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return <Text style={style}>{text.split(pattern).map((part, index) => terms.some((term) => term.toLocaleLowerCase() === part.toLocaleLowerCase()) ? <Text key={`${part}-${index}`} style={styles.highlight}>{part}</Text> : part)}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 58 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 19 },
  close: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#151C2E", marginRight: 14 },
  closeText: { color: "#F3F6FC", fontSize: 30, lineHeight: 34, fontWeight: "300", marginTop: -2 },
  title: { color: "#F3F6FC", fontSize: 23, fontWeight: "800", letterSpacing: -0.4 },
  searchBox: { marginHorizontal: 20, height: 54, borderRadius: 17, backgroundColor: "#151C2E", borderColor: "#34405A", borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  searchGlyph: { color: "#9CA9C4", fontSize: 25, marginRight: 9, marginTop: -3 },
  input: { flex: 1, color: "#F3F6FC", fontSize: 15, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 50 },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  resultLabel: { color: "#7C89A5", fontSize: 11, letterSpacing: 1.2, fontWeight: "800" },
  searchDetail: { color: "#63D2A3", fontSize: 10, fontWeight: "800" },
  result: { minHeight: 101, borderRadius: 18, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#26314B", flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginBottom: 10 },
  resultMark: { width: 9, alignSelf: "stretch", borderRadius: 7, marginVertical: 17, marginRight: 13 },
  resultCopy: { flex: 1, paddingVertical: 14 },
  resultTitle: { color: "#F3F6FC", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  highlight: { color: "#8F84FF" },
  resultSnippet: { color: "#9CA9C4", fontSize: 12, lineHeight: 17, marginTop: 3 },
  resultMeta: { color: "#7886A1", fontSize: 11, fontWeight: "700", marginTop: 7 },
  matchRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5, marginTop: 8 },
  matchChip: { borderRadius: 8, backgroundColor: "#23245A", paddingHorizontal: 7, paddingVertical: 3 },
  matchText: { color: "#BFB8FF", fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  scoreText: { color: "#71809A", fontSize: 10, fontWeight: "700", marginLeft: 2 },
  chevron: { color: "#9CA9C4", fontSize: 28, lineHeight: 28, marginLeft: 10 },
  empty: { paddingTop: 52, alignItems: "center", paddingHorizontal: 38 },
  emptyTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800" },
  emptyCopy: { color: "#9CA9C4", textAlign: "center", lineHeight: 20, fontSize: 14, marginTop: 8 },
  pressed: { opacity: 0.65 },
});
