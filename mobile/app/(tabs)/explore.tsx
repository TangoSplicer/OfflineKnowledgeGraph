import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";

import { ConceptRow } from "@/components/concept-row";
import { GraphCanvas, type SelectedGraphEdge } from "@/components/graph-canvas";
import { ScreenContainer } from "@/components/screen-container";
import { filterExploreConnections, matchingConceptIds, nearbyConceptsForQuery, type ExploreQuickFilter, type ExploreRelationshipFilter } from "@/lib/explore-filters";
import { buildGraphSvg } from "@/lib/graph-export";
import { relationshipTypes } from "@/lib/knowledge-data";
import { addSearchToHistory } from "@/lib/search-history";
import { useRelationshipStore } from "@/lib/relationship-store";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

const SEARCH_HISTORY_KEY = "offline-knowledge-graph.explore-search-history.v1";

export default function ExploreScreen() {
  const { concepts, connections, isReady, loadDemoGraph } = useRelationshipStore();
  const [quickFilter, setQuickFilter] = useState<ExploreQuickFilter>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<ExploreRelationshipFilter>("all");
  const [query, setQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<SelectedGraphEdge | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const graphRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(SEARCH_HISTORY_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) setSearchHistory(parsed.slice(0, 8));
      } catch {
        setSearchHistory([]);
      }
    }).catch(() => undefined);
  }, []);

  const recordSearch = useCallback((value: string) => {
    setSearchHistory((current) => {
      const next = addSearchToHistory(current, value);
      void AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const visibleConnections = useMemo(() => {
    const filtered = filterExploreConnections(connections, quickFilter, relationshipFilter);
    const matchingIds = matchingConceptIds(concepts, query);
    if (!query.trim()) return filtered;
    return filtered.filter((connection) => matchingIds.has(connection.sourceId) || matchingIds.has(connection.targetId));
  }, [concepts, connections, query, quickFilter, relationshipFilter]);
  const nearbyConcepts = useMemo(() => nearbyConceptsForQuery(concepts, visibleConnections, query), [concepts, visibleConnections, query]);

  const clearFilters = () => {
    setQuery("");
    setQuickFilter("all");
    setRelationshipFilter("all");
    setSelectedEdge(null);
    setExportStatus("");
  };

  const exportGraph = async (format: "svg" | "png") => {
    if (Platform.OS === "web") {
      setExportStatus("Image sharing is available in the installed Android app.");
      return;
    }
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "svg") {
        const file = new File(Paths.cache, `filtered-knowledge-graph-${stamp}.svg`);
        file.create({ overwrite: true, intermediates: true });
        file.write(buildGraphSvg(concepts, visibleConnections, { title: "Filtered Knowledge Graph", subtitle: `${nearbyConcepts.length} concepts · ${visibleConnections.length} relationships` }));
        if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
        await Sharing.shareAsync(file.uri, { dialogTitle: "Share filtered graph SVG", mimeType: "image/svg+xml" });
      } else {
        if (!graphRef.current) throw new Error("The graph is not ready to capture.");
        const uri = await captureRef(graphRef, { format: "png", quality: 1, result: "tmpfile" });
        if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
        await Sharing.shareAsync(uri, { dialogTitle: "Share filtered graph PNG", mimeType: "image/png" });
      }
      setExportStatus(`${format.toUpperCase()} export prepared with ${visibleConnections.length} filtered relationships.`);
    } catch (error) {
      setExportStatus(error instanceof Error ? error.message : `Unable to create a ${format.toUpperCase()} export.`);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={nearbyConcepts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={concepts.length ? (
          <View>
            <View style={styles.topline}>
              <View><Text style={styles.eyebrow}>SYSTEMS PRACTICE</Text><Text style={styles.title}>Explore connections</Text></View>
              <Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}><Text style={styles.searchIcon}>⌕</Text></Pressable>
            </View>
            <View style={styles.canvasWrap}><ViewShot ref={graphRef} options={{ format: "png", quality: 1 }} style={styles.captureFrame}><GraphCanvas concepts={concepts} connections={visibleConnections} onSelect={(id) => router.push(`/concept/${id}`)} onSelectEdge={setSelectedEdge} /></ViewShot></View>
            {selectedEdge ? <EdgeDetails edge={selectedEdge} onClose={() => setSelectedEdge(null)} onManage={() => router.push({ pathname: "/concept/[id]/relationships", params: { id: selectedEdge.source.id } })} onOpenConcept={(id) => router.push(`/concept/${id}`)} /> : null}
            <View style={styles.searchPanel}>
              <View style={styles.panelHeading}><View><Text style={styles.panelEyebrow}>GRAPH SEARCH</Text><Text style={styles.panelTitle}>Find a path through your graph</Text></View><Pressable onPress={() => setShowFilters((current) => !current)} style={({ pressed }) => [styles.filterToggle, pressed && styles.pressed]}><Text style={styles.filterToggleText}>{showFilters ? "Hide" : "Show"} filters</Text></Pressable></View>
              <View style={styles.inputWrap}><Text style={styles.inputIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => recordSearch(query)} placeholder="Search concepts, notes, or summaries" placeholderTextColor="#71809A" returnKeyType="search" style={styles.searchInput} /><Text style={styles.resultCount}>{visibleConnections.length}</Text></View>
              {searchHistory.length > 0 && !query ? <View style={styles.historySection}><Text style={styles.historyTitle}>RECENT SEARCHES</Text><View style={styles.historyRow}>{searchHistory.map((entry) => <Pressable key={entry} onPress={() => setQuery(entry)} style={({ pressed }) => [styles.historyChip, pressed && styles.pressed]}><Text style={styles.historyChipText} numberOfLines={1}>{entry}</Text></Pressable>)}</View></View> : null}
              {showFilters ? <><Text style={styles.filterLabel}>LINK SIGNAL</Text><View style={styles.chipRow}><ExploreChip label="All links" active={quickFilter === "all"} onPress={() => setQuickFilter("all")} /><ExploreChip label="Noted" active={quickFilter === "noted"} onPress={() => setQuickFilter("noted")} /><ExploreChip label="Strong" active={quickFilter === "strong"} onPress={() => setQuickFilter("strong")} /></View><Text style={styles.filterLabel}>RELATIONSHIP TYPE</Text><View style={styles.chipRow}><ExploreChip label="All types" active={relationshipFilter === "all"} onPress={() => setRelationshipFilter("all")} />{relationshipTypes.map((type) => <ExploreChip key={type} label={type} active={relationshipFilter === type} onPress={() => setRelationshipFilter(type)} />)}</View></> : null}
              {(query || quickFilter !== "all" || relationshipFilter !== "all") ? <Pressable onPress={clearFilters} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}><Text style={styles.clearText}>Clear search and filters</Text></Pressable> : null}
            </View>
            <View style={styles.exportCard}><View style={styles.exportHeading}><View><Text style={styles.panelEyebrow}>SHARE CURRENT VIEW</Text><Text style={styles.exportTitle}>Export filtered graph</Text></View><Text style={styles.exportCount}>{visibleConnections.length} links</Text></View><Text style={styles.exportDetail}>Save exactly what you are viewing, including active filters, as a shareable image.</Text><View style={styles.exportRow}><Pressable onPress={() => exportGraph("svg")} style={({ pressed }) => [styles.exportButton, pressed && styles.pressed]}><Text style={styles.exportButtonText}>Share SVG</Text></Pressable><Pressable onPress={() => exportGraph("png")} style={({ pressed }) => [styles.exportButton, styles.exportButtonAlt, pressed && styles.pressed]}><Text style={styles.exportButtonText}>Share PNG</Text></Pressable></View>{exportStatus ? <Text style={styles.exportStatus}>{exportStatus}</Text> : null}</View>
            <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Nearest concepts</Text><Text style={styles.sectionMeta}>{visibleConnections.length} links shown</Text></View>
          </View>
        ) : <ExploreEmpty isReady={isReady} onCreate={() => router.push("/first-concept-wizard")} onLoadDemo={loadDemoGraph} />}
        renderItem={({ item }) => <ConceptRow concept={item} onPress={() => router.push(`/concept/${item.id}`)} />}
        ListEmptyComponent={concepts.length ? <Text style={styles.emptyText}>No concepts or relationships match these filters. Try a broader search or clear the panel.</Text> : null}
        ListFooterComponent={concepts.length ? <Text style={styles.footer}>Tap a node to open its concept. Tap a link to inspect its relationship note.</Text> : null}
      />
    </ScreenContainer>
  );
}

function ExploreEmpty({ isReady, onCreate, onLoadDemo }: { isReady: boolean; onCreate: () => void; onLoadDemo: () => void }) {
  return <View style={styles.emptyExplore}><View style={styles.emptyExploreIcon}><Text style={styles.emptyExploreGlyph}>⌁</Text></View><Text style={styles.panelEyebrow}>YOUR GRAPH STARTS HERE</Text><Text style={styles.emptyExploreTitle}>There are no connections yet.</Text><Text style={styles.emptyExploreText}>Create your first concept from a short note, then return here to add meaningful relationships.</Text><Pressable disabled={!isReady} onPress={onCreate} style={({ pressed }) => [styles.emptyExploreButton, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.emptyExploreButtonText}>Create your first concept</Text><Text style={styles.emptyExploreArrow}>→</Text></Pressable><Pressable disabled={!isReady} onPress={onLoadDemo} style={({ pressed }) => [styles.emptyExploreDemo, pressed && styles.pressed, !isReady && styles.disabled]}><Text style={styles.emptyExploreDemoText}>Load demo graph instead</Text></Pressable></View>;
}

function ExploreChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }

function EdgeDetails({ edge, onClose, onManage, onOpenConcept }: { edge: SelectedGraphEdge; onClose: () => void; onManage: () => void; onOpenConcept: (id: string) => void }) { return <View style={styles.edgeDetails}><View style={styles.edgeDetailsTop}><Text style={styles.panelEyebrow}>RELATIONSHIP DETAIL</Text><Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable></View><View style={styles.edgePath}><Pressable onPress={() => onOpenConcept(edge.source.id)}><Text style={styles.edgeNode} numberOfLines={1}>{edge.source.title}</Text></Pressable><Text style={styles.edgeVerb}>{edge.connection.relationship}</Text><Pressable onPress={() => onOpenConcept(edge.target.id)}><Text style={styles.edgeNode} numberOfLines={1}>{edge.target.title}</Text></Pressable></View><View style={styles.edgeMeta}><Text style={styles.edgeMetaText}>{[1, 2, 3, 4, 5].map((bar) => bar <= edge.connection.strength ? "●" : "○").join(" ")} strength</Text><Text style={styles.edgeMetaText}>{edge.connection.note ? "Has note" : "No note yet"}</Text></View><Text style={styles.edgeNote}>{edge.connection.note || "This relationship does not have a note yet. Add one from Manage relationships."}</Text><Pressable onPress={onManage} style={({ pressed }) => [styles.manageButton, pressed && styles.pressed]}><Text style={styles.manageText}>Manage this relationship</Text><Text style={styles.manageArrow}>→</Text></Pressable></View>; }

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 116 }, topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, eyebrow: { color: "#48D6E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 }, title: { color: "#F3F6FC", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 }, searchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151C2E", borderColor: "#2A3652", borderWidth: 1, justifyContent: "center", alignItems: "center" }, searchIcon: { color: "#F3F6FC", fontSize: 28, marginTop: -4 }, canvasWrap: { borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "#26314B" }, captureFrame: { width: "100%" }, searchPanel: { borderRadius: 21, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#2E3D5D", padding: 15, marginTop: 14 }, panelHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, panelEyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" }, panelTitle: { color: "#EFF2F9", fontSize: 15, lineHeight: 20, fontWeight: "800", marginTop: 4 }, filterToggle: { backgroundColor: "#202949", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 }, filterToggleText: { color: "#C9C4FF", fontSize: 10, fontWeight: "800" }, inputWrap: { height: 46, marginTop: 13, borderRadius: 12, backgroundColor: "#0C1426", borderWidth: 1, borderColor: "#344563", flexDirection: "row", alignItems: "center", paddingHorizontal: 11 }, inputIcon: { color: "#8F84FF", fontSize: 23, marginRight: 7, marginTop: -4 }, searchInput: { flex: 1, color: "#EDF2FB", fontSize: 12, paddingVertical: 0 }, resultCount: { color: "#63D2A3", fontSize: 11, fontWeight: "900", marginLeft: 7 }, historySection: { borderTopWidth: 1, borderTopColor: "#26314B", marginTop: 13, paddingTop: 11 }, historyTitle: { color: "#71809A", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginBottom: 7 }, historyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, historyChip: { maxWidth: 155, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#31415F" }, historyChipText: { color: "#C4CDE0", fontSize: 10, fontWeight: "800" }, filterLabel: { color: "#71809A", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginTop: 14, marginBottom: 7 }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, chip: { minHeight: 31, borderRadius: 10, backgroundColor: "#1B2842", borderWidth: 1, borderColor: "#31415F", paddingHorizontal: 10, justifyContent: "center" }, chipActive: { backgroundColor: "#332E75", borderColor: "#8B81FA" }, chipText: { color: "#AAB6C9", fontSize: 10, fontWeight: "800" }, chipTextActive: { color: "#F0EEFF" }, clearButton: { alignSelf: "flex-start", marginTop: 13, paddingVertical: 3 }, clearText: { color: "#FFB86B", fontSize: 11, fontWeight: "800" }, edgeDetails: { borderRadius: 20, backgroundColor: "#171C39", borderWidth: 1, borderColor: "#7369E5", padding: 15, marginTop: 12 }, edgeDetailsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, closeButton: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", backgroundColor: "#2B3159" }, closeText: { color: "#D9D6FF", fontSize: 22, lineHeight: 22, marginTop: -2 }, edgePath: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 }, edgeNode: { flexShrink: 1, color: "#F4F4FF", fontSize: 14, fontWeight: "900", textDecorationLine: "underline" }, edgeVerb: { color: "#B8B0FF", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }, edgeMeta: { flexDirection: "row", gap: 15, marginTop: 10 }, edgeMetaText: { color: "#8FA0BD", fontSize: 10, fontWeight: "800" }, edgeNote: { color: "#C0C9DA", fontSize: 12, lineHeight: 18, marginTop: 11 }, manageButton: { minHeight: 40, borderRadius: 11, backgroundColor: "#28235A", marginTop: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, manageText: { color: "#E9E6FF", fontSize: 12, fontWeight: "900" }, manageArrow: { color: "#BEB8FF", fontSize: 18 }, exportCard: { borderRadius: 18, backgroundColor: "#101A2C", borderWidth: 1, borderColor: "#2E4861", padding: 14, marginTop: 12 }, exportHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, exportTitle: { color: "#E8EDF8", fontSize: 14, fontWeight: "800", marginTop: 4 }, exportCount: { color: "#63D2A3", fontSize: 11, fontWeight: "900" }, exportDetail: { color: "#91A0B9", fontSize: 11, lineHeight: 16, marginTop: 7 }, exportRow: { flexDirection: "row", gap: 8, marginTop: 12 }, exportButton: { flex: 1, minHeight: 40, borderRadius: 11, justifyContent: "center", alignItems: "center", backgroundColor: "#2E2869", borderWidth: 1, borderColor: "#8B81F7" }, exportButtonAlt: { backgroundColor: "#1E3844", borderColor: "#49A4AE" }, exportButtonText: { color: "#EDEBFF", fontSize: 11, fontWeight: "900" }, exportStatus: { color: "#87DDB9", fontSize: 10, lineHeight: 15, marginTop: 9 }, sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 23, marginBottom: 12 }, sectionTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800" }, sectionMeta: { color: "#9CA9C4", fontSize: 12, fontWeight: "600" }, emptyText: { color: "#91A0B9", fontSize: 13, lineHeight: 20, paddingVertical: 9 },   footer: { color: "#66738F", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 16 }, emptyExplore: { marginTop: 34, borderRadius: 24, padding: 20, backgroundColor: "#111A2D", borderWidth: 1, borderColor: "#394677" }, emptyExploreIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#292560", marginBottom: 20 }, emptyExploreGlyph: { color: "#C9C3FF", fontSize: 29 }, emptyExploreTitle: { color: "#F3F6FC", fontSize: 23, lineHeight: 29, fontWeight: "800", marginTop: 7 }, emptyExploreText: { color: "#A4B1C8", fontSize: 14, lineHeight: 21, marginTop: 8 }, emptyExploreButton: { minHeight: 49, borderRadius: 13, backgroundColor: "#7C6CFF", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 }, emptyExploreButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, emptyExploreArrow: { color: "#FFFFFF", fontSize: 20 }, emptyExploreDemo: { minHeight: 43, alignItems: "center", justifyContent: "center" }, emptyExploreDemoText: { color: "#B9B2FF", fontSize: 12, fontWeight: "800" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.65 },
});
