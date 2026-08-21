import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { concepts as seededConcepts, connections as seededConnections } from "../lib/knowledge-data";
import type { Concept, Connection } from "../lib/knowledge-data";
import { visibleGraphConnections } from "../lib/graph-relationships";
import { edgeOpacity, edgeStrokeWidth, strengthLabel } from "../lib/relationship-strength-visuals";
import { graphPositionFor, type GraphLayout } from "../lib/graph-layouts";
import { evidenceConfidenceColor, evidenceConfidenceLabel } from "../lib/relationship-evidence";
import { graphNodeLabel, shouldShowGraphNodeLabel, type GraphLabelDensity } from "../lib/graph-node-labels";
import { clampGraphCanvasScale, clampGraphCanvasTranslation, nextGraphCanvasViewportForKey } from "../lib/graph-canvas-navigation";

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
  labelDensity?: GraphLabelDensity;
  focusedLabelPreview?: boolean;
  resetViewToken?: number;
  onZoomChange?: (percent: number) => void;
};

export function GraphCanvas({ compact = false, concepts = seededConcepts, connections = seededConnections, focusId = "adaptive-systems", onSelect, onSelectEdge, layout = "balanced", labelDensity = "all", focusedLabelPreview = false, resetViewToken = 0, onZoomChange }: GraphCanvasProps) {
  const canvasHeight = compact ? 250 : 330;
  const [canvasWidth, setCanvasWidth] = useState(360);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const lastReportedZoom = useSharedValue(100);
  const visibleConcepts = useMemo(() => compact ? concepts.filter((concept) => concept.id !== "donella-meadows") : concepts, [compact, concepts]);
  const visibleConnections = useMemo(() => visibleGraphConnections(concepts, connections, compact), [compact, concepts, connections]);
  const positions = useMemo(() => new Map(visibleConcepts.map((concept, index) => [concept.id, graphPositionFor(concept.id, index, visibleConcepts.length, layout)])), [visibleConcepts, layout]);
  const onLayout = (event: LayoutChangeEvent) => setCanvasWidth(event.nativeEvent.layout.width || 360);
  const reportZoomLevel = useCallback((percent: number) => onZoomChange?.(percent), [onZoomChange]);
  const reportZoomFromWorklet = (nextScale: number) => {
    "worklet";
    const percent = Math.round(nextScale * 100);
    if (percent !== lastReportedZoom.value) {
      lastReportedZoom.value = percent;
      runOnJS(reportZoomLevel)(percent);
    }
  };

  useEffect(() => {
    scale.value = withTiming(1, { duration: 180 });
    translationX.value = withTiming(0, { duration: 180 });
    translationY.value = withTiming(0, { duration: 180 });
    lastReportedZoom.value = 100;
    onZoomChange?.(100);
  }, [lastReportedZoom, onZoomChange, resetViewToken, scale, translationX, translationY]);

  const panSceneStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translationX.value }, { translateY: translationY.value }] }));
  const zoomSceneStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => { pinchStartScale.value = scale.value; })
    .onUpdate((event) => {
      const nextScale = clampGraphCanvasScale(pinchStartScale.value * event.scale);
      const nextTranslation = clampGraphCanvasTranslation({ x: translationX.value, y: translationY.value }, nextScale, canvasWidth, canvasHeight);
      scale.value = nextScale;
      translationX.value = nextTranslation.x;
      translationY.value = nextTranslation.y;
      reportZoomFromWorklet(nextScale);
    })
    .onEnd(() => {
      const nextTranslation = clampGraphCanvasTranslation({ x: translationX.value, y: translationY.value }, scale.value, canvasWidth, canvasHeight);
      translationX.value = withTiming(nextTranslation.x, { duration: 140 });
      translationY.value = withTiming(nextTranslation.y, { duration: 140 });
    });
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .minDistance(7)
    .onBegin(() => { panStartX.value = translationX.value; panStartY.value = translationY.value; })
    .onUpdate((event) => {
      const nextTranslation = clampGraphCanvasTranslation({ x: panStartX.value + event.translationX, y: panStartY.value + event.translationY }, scale.value, canvasWidth, canvasHeight);
      translationX.value = nextTranslation.x;
      translationY.value = nextTranslation.y;
    })
    .onEnd(() => {
      const nextTranslation = clampGraphCanvasTranslation({ x: translationX.value, y: translationY.value }, scale.value, canvasWidth, canvasHeight);
      translationX.value = withTiming(nextTranslation.x, { duration: 140 });
      translationY.value = withTiming(nextTranslation.y, { duration: 140 });
    });
  const doubleTapResetGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(18)
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 180 });
      translationX.value = withTiming(0, { duration: 180 });
      translationY.value = withTiming(0, { duration: 180 });
      reportZoomFromWorklet(1);
    });
  const navigationGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapResetGesture);
  const handleWebKeyDown = useCallback((event: any) => {
    if (Platform.OS !== "web") return;
    const key = event?.nativeEvent?.key ?? event?.key;
    if (typeof key !== "string") return;
    const viewport = nextGraphCanvasViewportForKey(key, { scale: scale.value, translation: { x: translationX.value, y: translationY.value } }, canvasWidth, canvasHeight);
    if (!viewport) return;
    event?.preventDefault?.();
    scale.value = withTiming(viewport.scale, { duration: 140 });
    translationX.value = withTiming(viewport.translation.x, { duration: 140 });
    translationY.value = withTiming(viewport.translation.y, { duration: 140 });
    lastReportedZoom.value = Math.round(viewport.scale * 100);
    reportZoomLevel(lastReportedZoom.value);
  }, [canvasHeight, canvasWidth, lastReportedZoom, reportZoomLevel, scale, translationX, translationY]);
  const webKeyboardProps = Platform.OS === "web" ? ({ tabIndex: 0, onKeyDown: handleWebKeyDown } as any) : {};

  const selectEdge = (connection: Connection) => {
    setSelectedEdgeId(connection.id);
    const source = concepts.find((concept) => concept.id === connection.sourceId);
    const target = concepts.find((concept) => concept.id === connection.targetId);
    if (source && target) onSelectEdge?.({ connection, source, target });
  };

  return (
    <View {...webKeyboardProps} accessible={!compact} accessibilityLabel={compact ? undefined : "Interactive graph canvas. Pinch to zoom, drag to pan, double-tap to reset. On web, focus this canvas and use arrow keys, plus, minus, or zero."} onLayout={onLayout} style={[styles.canvas, { height: canvasHeight }, compact && styles.compactCanvas]}>
      <GestureDetector gesture={navigationGesture}>
        <Animated.View style={[styles.scene, panSceneStyle]}>
          <Animated.View style={[styles.scene, zoomSceneStyle]}>
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
        return <GraphNode key={concept.id} label={graphNodeLabel(concept.title, compact)} showLabel={shouldShowGraphNodeLabel(labelDensity, index, featured, focusedLabelPreview)} color={concept.color} compact={compact} style={{ width: compact ? 94 : 126, left: position.x * canvasWidth - (compact ? 47 : 63), top: position.y * canvasHeight - nodeSize / 2 }} nodeStyle={{ width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2 }} onPress={() => onSelect(concept.id)} featured={featured} />;
      })}
      {!compact && <View style={styles.legend}><View style={styles.legendLines}><View style={[styles.legendLine, styles.legendLineLight]} /><View style={[styles.legendLine, styles.legendLineStrong]} /></View><Text style={styles.legendText}>{visibleConnections.length} links · thickness = strength · color = evidence · tap for detail</Text></View>}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function GraphNode({ label, showLabel, color, style, nodeStyle, compact = false, featured = false, onPress }: { label: string; showLabel: boolean; color: string; style: object; nodeStyle: object; compact?: boolean; featured?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${label}`} onPress={onPress} style={({ pressed }) => [styles.nodeWrap, style, pressed && styles.nodePressed]}><View style={[styles.node, featured && styles.featuredNode, { backgroundColor: color, shadowColor: color }, nodeStyle]}><View style={styles.nodeCore} /></View>{showLabel ? <Text numberOfLines={2} style={[styles.nodeLabel, compact && styles.compactNodeLabel, featured && styles.featuredLabel]}>{label}</Text> : null}</Pressable>;
}

const styles = StyleSheet.create({
  canvas: { position: "relative", overflow: "hidden", borderRadius: 28, backgroundColor: "#0E1528" },
  compactCanvas: { borderRadius: 24 },
  scene: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  orbit: { position: "absolute", width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: "rgba(124,108,255,0.22)", left: "18%", top: 47 },
  compactOrbit: { transform: [{ scale: 0.8 }], top: 21 },
  edgeHitbox: { position: "absolute", height: 28, justifyContent: "center" },
  edge: { borderRadius: 4, alignSelf: "center" },
  edgePressed: { opacity: 0.58 },
  nodeWrap: { position: "absolute", alignItems: "center" },
  node: { alignItems: "center", justifyContent: "center", shadowOpacity: 0.34, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  nodeCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(8,16,29,0.66)" },
  featuredNode: { borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" },
  nodePressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  nodeLabel: { minHeight: 30, marginTop: 5, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, overflow: "hidden", color: "#ECF2FB", backgroundColor: "rgba(10,16,31,0.9)", textAlign: "center", fontSize: 10, fontWeight: "800", lineHeight: 13 },
  compactNodeLabel: { minHeight: 25, marginTop: 4, paddingHorizontal: 4, paddingVertical: 2, fontSize: 8.5, lineHeight: 11 },
  featuredLabel: { color: "#FFFFFF", backgroundColor: "rgba(42,37,96,0.94)", fontSize: 11, lineHeight: 14 },
  legend: { position: "absolute", left: 15, bottom: 13, flexDirection: "row", alignItems: "center", borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(11,16,32,0.84)" },
  legendLines: { width: 17, height: 13, justifyContent: "space-around", marginRight: 6 },
  legendLine: { width: 14, borderRadius: 3, backgroundColor: "#48D6E8" },
  legendLineLight: { height: 1.5, opacity: 0.58 },
  legendLineStrong: { height: 4, opacity: 0.98 },
  legendText: { color: "#A5B2CB", fontSize: 10, fontWeight: "700" },
});
