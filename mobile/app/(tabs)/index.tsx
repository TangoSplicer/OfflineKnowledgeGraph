import { Stack, router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { GraphCanvas } from "@/components/graph-canvas";
import { ScreenContainer } from "@/components/screen-container";
import { activity, reviewCues } from "@/lib/knowledge-data";

export default function TodayScreen() {
  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={activity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View><Text style={styles.eyebrow}>OFFLINE KNOWLEDGE GRAPH</Text><Text style={styles.greeting}>Make sense of what you know.</Text></View>
              <Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.search, pressed && styles.pressed]}><Text style={styles.searchText}>⌕</Text></Pressable>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/explore")} style={({ pressed }) => [styles.graphCard, pressed && styles.pressed]}>
              <View style={styles.graphCardTop}><View><Text style={styles.graphLabel}>ACTIVE GRAPH</Text><Text style={styles.graphName}>Systems Practice</Text></View><Text style={styles.exploreLink}>Explore →</Text></View>
              <GraphCanvas compact onSelect={(id) => router.push(`/concept/${id}`)} />
              <View style={styles.graphFooter}><View><Text style={styles.graphStat}>128</Text><Text style={styles.graphStatLabel}>concepts</Text></View><View style={styles.footerDivider} /><View><Text style={styles.graphStat}>304</Text><Text style={styles.graphStatLabel}>relationships</Text></View><View style={styles.footerDivider} /><View style={styles.localRow}><View style={styles.localDot} /><Text style={styles.localText}>Local-first</Text></View></View>
            </Pressable>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>A gentle nudge</Text><Text style={styles.sectionHint}>for your graph</Text></View>
            <View style={styles.cueCard}><View style={[styles.cueStripe, { backgroundColor: reviewCues[0].tint }]} /><View style={styles.cueCopy}><Text style={styles.cueTitle}>{reviewCues[0].label}</Text><Text style={styles.cueDetail}>{reviewCues[0].detail}</Text></View><Text style={styles.cueArrow}>›</Text></View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent activity</Text><Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.allLink}>Library</Text></Pressable></View>
          </View>
        }
        renderItem={({ item }) => <View style={styles.activityRow}><View style={[styles.activityMark, { backgroundColor: item.color }]} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activityDetail}>{item.detail}</Text></View><Text style={styles.activityTime}>{item.time}</Text></View>}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
      <Pressable onPress={() => router.push("/capture")} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}><Text style={styles.fabText}>＋</Text><Text style={styles.fabLabel}>New concept</Text></Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 88 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 23 },
  eyebrow: { color: "#48D6E8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  greeting: { color: "#F3F6FC", fontSize: 28, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7, maxWidth: 270 },
  search: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", alignItems: "center", justifyContent: "center", marginTop: 2 },
  searchText: { color: "#F3F6FC", fontSize: 28, lineHeight: 28, marginTop: -5 },
  graphCard: { borderRadius: 26, overflow: "hidden", backgroundColor: "#11192B", borderWidth: 1, borderColor: "#26314B" },
  graphCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 17, paddingBottom: 12 },
  graphLabel: { color: "#8A98B4", fontSize: 10, letterSpacing: 1.1, fontWeight: "900", marginBottom: 4 },
  graphName: { color: "#F3F6FC", fontSize: 17, fontWeight: "800" },
  exploreLink: { color: "#A9A0FF", fontSize: 13, fontWeight: "800" },
  graphFooter: { height: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, justifyContent: "space-between" },
  graphStat: { color: "#F3F6FC", fontSize: 15, fontWeight: "800" },
  graphStatLabel: { color: "#8693AD", fontSize: 10, fontWeight: "600", marginTop: 2 },
  footerDivider: { width: 1, height: 26, backgroundColor: "#293551" },
  localRow: { flexDirection: "row", alignItems: "center" },
  localDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#63D2A3", marginRight: 6 },
  localText: { color: "#B9C8DD", fontSize: 11, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 27, marginBottom: 11 },
  sectionTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  sectionHint: { color: "#7D8AA5", fontSize: 12 },
  allLink: { color: "#A9A0FF", fontSize: 13, fontWeight: "800" },
  cueCard: { minHeight: 76, borderRadius: 19, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2A3652", flexDirection: "row", alignItems: "center", overflow: "hidden" },
  cueStripe: { width: 4, alignSelf: "stretch" },
  cueCopy: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  cueTitle: { color: "#E9EDF7", fontSize: 14, fontWeight: "800" },
  cueDetail: { color: "#94A1BA", fontSize: 12, marginTop: 4 },
  cueArrow: { color: "#A5B0C7", fontSize: 27, marginRight: 16 },
  activityRow: { minHeight: 67, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#202B44" },
  activityMark: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  activityCopy: { flex: 1 },
  activityTitle: { color: "#E8EDF8", fontSize: 14, fontWeight: "700" },
  activityDetail: { color: "#8794AE", fontSize: 12, marginTop: 3 },
  activityTime: { color: "#71809D", fontSize: 11, fontWeight: "700" },
  footerSpace: { height: 38 },
  fab: { position: "absolute", right: 20, bottom: 18, height: 50, borderRadius: 25, backgroundColor: "#7C6CFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 17, shadowColor: "#000000", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabText: { color: "#FFFFFF", fontSize: 24, lineHeight: 25, marginRight: 6, marginTop: -2 },
  fabLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  fabPressed: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
