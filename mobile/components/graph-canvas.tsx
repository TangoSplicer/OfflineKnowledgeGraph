import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";

import { concepts as seededConcepts, connections as seededConnections } from "../lib/knowledge-data";
import type { Concept, Connection } from "../lib/knowledge-data";
import { visibleGraphConnections } from "../lib/graph-relationships";
import { edgeOpacity, edgeStrokeWidth, strengthLabel } from "../lib/relationship-strength-visuals";
import { graphPositionFor, type GraphLayout } from "../lib/graph-layouts";
import { evidenceConfidenceColor, evidenceConfidenceLabel } from "../lib/relationship-evidence";

export type SelectedGraphEdge = {
  connection: Connection;
  source: Concept;
  target: Concept;
};

type GraphCanvasProps = {
  compact?: boolean;
  concepts?: Concept[];
  connections?: Connection[];
  focusId?: string;
  onSelect: (id: string) => void;
  onSelectEdge?: (edge: SelectedGraphEdge) => void;
  layout?: GraphLayout;
};

type Position = { x: number; y: number };

export function GraphCanvas({ compact = false, concepts = seededConcepts, connections = seededConnections, focusId = "adaptive-systems", onSelect, onSelectEdge, layout = "balanced" }: GraphCanvasProps) {
  const canvasHeight = compact ? 250 : 330;
  const [canvasWidth, setCanvasWidth] = useState(360);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const visibleConcepts = useMemo(() => compact ? concepts.filter((concept) => concept.id !== "donella-meadows") : concepts, [compact, concepts]);
  const visibleConnections = useMemo(() => visibleGraphConnections(concepts, connections, compact), [compact, concepts, connections]);
  const positions = useMemo(() => new Map(visibleConcepts.map((concept, index) => [concept.id, graphPositionFor(concept.id, index, visibleConcepts.length, layout)])), [visibleConcepts, layout]);
  const notedConnections = visibleConnections.filter((connection) => connection.note.length > 0).length;
  const onLayout = (event: LayoutChangeEvent) => setCanvasWidth(event.nativeEvent.layout.width || 360);

  const selectEdge = (connection: Connection) => {
    setSelectedEdgeId(connection.id);
    const source = concepts.find((concept) => concept.id === connection.sourceId);
    const target = concepts.find((concept) => concept.id === connection.targetId);
    if (source && target) onSelectEdge?.({ connection, source, target });
  };

  return (
    <View onLayout={onLayout} style={[styles.canvas, { height: canvasHeight }, compact && styles.compactCanvas]}>
      <View style={[styles.orbit, compact && styles.compactOrbit]} />
      {visibleConnections.map((connection) => {
        const start = positions.get(connection.sourceId);
        const end = positions.get(connection.targetId);
        if (!start || !end) return null;
        const startX = start.x * canvasWidth;
        const startY = start.y * canvasHeight;
        const endX = end.x * canvasWidth;
        const endY = end.y * canvasHeight;
        const length = Math.hypot(endX - startX, endY - startY);
        const rotation = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        const noted = Boolean(connection.note);
        const selected = selectedEdgeId === connection.id;
        const confidence = connection.evidenceConfidence;
        return <Pressable key={connection.id} accessibilityRole="button" accessibilityLabel={`Open ${connection.relationship} relationship, ${strengthLabel(connection.strength)}, ${evidenceConfidenceLabel(confidence)} evidence`} onPress={() => selectEdge(connection)} style={({ pressed }) => [styles.edgeHitbox, { width: length + 20, left: (startX + endX - length) / 2 - 10, top: (startY + endY) / 2 - 14, transform: [{ rotate: `${rotation}deg` }] }, pressed && styles.edgePressed]}><View style={[styles.edge, { width: length, height: selected ? 5.2 : edgeStrokeWidth(connection.strength, noted), opacity: selected ? 1 : Math.max(edgeOpacity(connection.strength, false), 0.46 + ((confidence ?? 3) * 0.09)), backgroundColor: selected ? "#FFFFFF" : evidenceConfidenceColor(confidence) }]} /></Pressable>;
      })}
      {visibleConcepts.map((concept, index) => {
        const position = positions.get(concept.id) ?? graphPositionFor(concept.id, index, visibleConcepts.length, layout);
        const featured = concept.id === focusId;
        const nodeSize = (featured ? 110 : 72) * (compact ? 0.82 : 1);
        return <GraphNode key={concept.id} label={concept.title.split(" ")[0]} color={concept.color} style={{ width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2, left: position.x * canvasWidth - nodeSize / 2, top: position.y * canvasHeight - nodeSize / 2 }} onPress={() => onSelect(concept.id)} featured={featured} />;
      })}
      {!compact && <View style={styles.legend}><View style={styles.legendLines}><View style={[styles.legendLine, styles.legendLineLight]} /><View style={[styles.legendLine, styles.legendLineStrong]} /></View><Text style={styles.legendText}>{visibleConnections.length} links · thickness = strength · color = evidence · tap for detail</Text></View>}
    </View>
  );
}

function GraphNode({ label, color, style, featured = false, onPress }: { label: string; color: string; style: object; featured?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.node, featured && styles.featuredNode, { backgroundColor: color, shadowColor: color }, style, pressed && styles.nodePressed]}><Text style={[styles.nodeText, featured && styles.featuredText]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  canvas: { position: "relative", overflow: "hidden", borderRadius: 28, backgroundColor: "#0E1528" },
  compactCanvas: { borderRadius: 24 },
  orbit: { position: "absolute", width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: "rgba(124,108,255,0.22)", left: "18%", top: 47 },
  compactOrbit: { transform: [{ scale: 0.8 }], top: 21 },
  edgeHitbox: { position: "absolute", height: 28, justifyContent: "center" },
  edge: { borderRadius: 4, alignSelf: "center" },
  edgePressed: { opacity: 0.58 },
  node: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 8, shadowOpacity: 0.34, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  featuredNode: { borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" },
  nodePressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  nodeText: { color: "#08101D", textAlign: "center", fontSize: 10, fontWeight: "800", lineHeight: 13 },
  featuredText: { color: "#FFFFFF", fontSize: 13, lineHeight: 17 },
  legend: { position: "absolute", left: 15, bottom: 13, flexDirection: "row", alignItems: "center", borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(11,16,32,0.84)" },
  legendLines: { width: 17, height: 13, justifyContent: "space-around", marginRight: 6 },
  legendLine: { width: 14, borderRadius: 3, backgroundColor: "#48D6E8" },
  legendLineLight: { height: 1.5, opacity: 0.58 },
  legendLineStrong: { height: 4, opacity: 0.98 },
  legendText: { color: "#A5B2CB", fontSize: 10, fontWeight: "700" },
});
