import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Stack, router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useRelationshipStore } from "@/lib/relationship-store";
import { useColors } from "@/hooks/use-colors";

type LibraryRowProps = {
  title: string;
  detail: string;
  symbol: string;
  onPress: () => void;
};

export default function LibraryScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 860;
  const {
    concepts,
    archivedConcepts,
    connections,
    loadDemoGraph,
  } = useRelationshipStore();

  return (
    <ScreenContainer containerClassName="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, isWideWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>LOCAL LIBRARY</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your thinking, in one place.</Text>
        <Text style={styles.subtitle}>
          Keep the tools you need close. Everything shown here works from this device.
        </Text>

        <View style={[styles.graphSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryHeading}>
            <View>
              <Text style={styles.summaryEyebrow}>THIS DEVICE</Text>
              <Text style={styles.summaryTitle}>Your local graph</Text>
            </View>
            <View style={styles.localBadge}><View style={styles.localDot} /><Text style={styles.localBadgeText}>Offline</Text></View>
          </View>
          <View style={styles.summaryMetrics}>
            <Metric value={`${concepts.length}`} label="ideas" />
            <View style={styles.metricDivider} />
            <Metric value={`${connections.length}`} label="links" />
            <View style={styles.metricDivider} />
            <Metric value={`${archivedConcepts.length}`} label="archived" />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore your graph"
            onPress={() => router.push("/(tabs)/explore")}
            style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
          >
            <Text style={styles.exploreButtonText}>Explore your graph</Text>
            <Text style={styles.exploreButtonArrow}>→</Text>
          </Pressable>
        </View>

        {!concepts.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Start from a blank graph.</Text>
            <Text style={styles.emptyText}>
              Capture a first idea, restore a backup, or load an example only when you want a reference.
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create idea"
                onPress={() => router.push("/first-concept-wizard")}
                style={({ pressed }) => [styles.emptyPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.emptyPrimaryText}>Create idea</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Load example graph"
                onPress={loadDemoGraph}
                style={({ pressed }) => [styles.emptySecondary, pressed && styles.pressed]}
              >
                <Text style={styles.emptySecondaryText}>Load example</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>ORGANIZE YOUR IDEAS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LibraryRow
            symbol="◇"
            title="Starting templates"
            detail="Reuse and refine your own concept starting points."
            onPress={() => router.push("/template-library")}
          />
          <LibraryRow
            symbol="↺"
            title={`Archived ideas${archivedConcepts.length ? ` · ${archivedConcepts.length}` : ""}`}
            detail="Restore preserved concepts and their history."
            onPress={() => router.push("/archived-concepts" as never)}
          />
          <LibraryRow
            symbol="↗"
            title="Graph analysis"
            detail="Compare ideas, trace paths, and find useful bridges."
            onPress={() => router.push("/graph-tools" as never)}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>REVIEW AND DEVELOP</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LibraryRow
            symbol="✓"
            title="Evidence review"
            detail="Strengthen unsupported or uncertain relationships."
            onPress={() => router.push("/evidence-review" as never)}
          />
          <LibraryRow
            symbol="?"
            title="Research questions"
            detail="Hold claims, sources, counterpoints, and open gaps."
            onPress={() => router.push("/research-questions" as never)}
          />
          <LibraryRow
            symbol="□"
            title="Capture inbox"
            detail="Collect raw notes before turning them into ideas."
            onPress={() => router.push("/capture-inbox" as never)}
          />
          <LibraryRow
            symbol="◷"
            title="Weekly review"
            detail="Turn small maintenance cues into a focused next step."
            onPress={() => router.push("/weekly-review" as never)}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>BACKUP &amp; SAFETY</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LibraryRow
            symbol="⬆"
            title="Backup & restore"
            detail="One place for protected ZIPs, JSON backups, and starting over — with a snapshot saved before every replace."
            onPress={() => router.push("/backup-restore" as never)}
          />
          <LibraryRow
            symbol="⇄"
            title="Knowledge exchange"
            detail="Share selected local bundles or review an incoming one."
            onPress={() => router.push("/knowledge-exchange" as never)}
          />
          <LibraryRow
            symbol="◷"
            title="Export history"
            detail="Review recent local archive records and their verified creation times."
            onPress={() => router.push("/export-history" as never)}
          />
          <LibraryRow
            symbol="⌁"
            title="Nearby device transfer"
            detail="Pair a nearby device over local Wi-Fi, Bluetooth, or QR."
            onPress={() => router.push("/device-pairing" as never)}
          />
          <LibraryRow
            symbol="◒"
            title="Local backup routines"
            detail="Schedule protected snapshots that stay under your control."
            onPress={() => router.push("/backup-schedules" as never)}
            last
          />
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function LibraryRow({ title, detail, symbol, onPress, last = false }: LibraryRowProps & { last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.libraryRow, !last && styles.libraryRowDivider, pressed && styles.pressed]}>
      <View style={styles.rowSymbol}><Text style={styles.rowSymbolText}>{symbol}</Text></View>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 112 },
  webContent: { maxWidth: 980, paddingHorizontal: 38, paddingTop: 34, paddingBottom: 48 },
  eyebrow: { color: "#48D6E8", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  title: { color: "#F3F6FC", fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: "#9CA9C4", fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 335 },
  graphSummary: { marginTop: 21, borderRadius: 22, padding: 17, backgroundColor: "#111B2E", borderWidth: 1, borderColor: "#344666" },
  summaryHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  summaryEyebrow: { color: "#6E819E", fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  summaryTitle: { color: "#F3F6FC", fontSize: 18, fontWeight: "800", marginTop: 5 },
  localBadge: { flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: "#153438", paddingHorizontal: 9, paddingVertical: 5 },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#72D6AD", marginRight: 6 },
  localBadgeText: { color: "#B7ECD7", fontSize: 10, fontWeight: "900" },
  summaryMetrics: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 19, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#263553" },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { color: "#EAF0FA", fontSize: 18, fontWeight: "900" },
  metricLabel: { color: "#8493AA", fontSize: 12, fontWeight: "800", marginTop: 3 },
  metricDivider: { width: 1, height: 26, backgroundColor: "#30405D" },
  exploreButton: { minHeight: 45, borderRadius: 13, backgroundColor: "#272660", paddingHorizontal: 14, marginTop: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exploreButtonText: { color: "#E8E7FF", fontSize: 14, fontWeight: "900" },
  exploreButtonArrow: { color: "#B9B3FF", fontSize: 19, fontWeight: "900" },
  emptyCard: { marginTop: 16, borderRadius: 18, padding: 15, backgroundColor: "#142738", borderWidth: 1, borderColor: "#365C76" },
  emptyTitle: { color: "#E2F2F6", fontSize: 15, fontWeight: "900" },
  emptyText: { color: "#A5C0CB", fontSize: 13, lineHeight: 18, marginTop: 5 },
  emptyActions: { flexDirection: "row", gap: 9, marginTop: 13 },
  emptyPrimary: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#48B8C6" },
  emptyPrimaryText: { color: "#07151B", fontSize: 12, fontWeight: "900" },
  emptySecondary: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#52788C", backgroundColor: "#173244" },
  emptySecondaryText: { color: "#C5EAF0", fontSize: 12, fontWeight: "900" },
  sectionLabel: { color: "#73839E", fontSize: 11, fontWeight: "900", letterSpacing: 1.05, marginTop: 27, marginBottom: 9 },
  sectionCard: { borderRadius: 19, backgroundColor: "#111A2B", borderWidth: 1, borderColor: "#2B3955", overflow: "hidden" },
  libraryRow: { minHeight: 70, paddingHorizontal: 13, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  libraryRowDivider: { borderBottomWidth: 1, borderColor: "#25334D" },
  rowSymbol: { width: 33, height: 33, borderRadius: 11, backgroundColor: "#1C2B46", alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowSymbolText: { color: "#84E3EA", fontSize: 16, fontWeight: "800" },
  rowCopy: { flex: 1, paddingRight: 10 },
  rowTitle: { color: "#EEF2FA", fontSize: 14, fontWeight: "900" },
  rowDetail: { color: "#92A1B9", fontSize: 13, lineHeight: 16, marginTop: 3 },
  rowArrow: { color: "#9DACCA", fontSize: 24, lineHeight: 24 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
