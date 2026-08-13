import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { findConcept, relationshipTypes, type RelationshipType, type RelationshipView } from "@/lib/knowledge-data";
import { useRelationshipStore } from "@/lib/relationship-store";

const strengthLabel = (strength: number) => ["Light", "Gentle", "Moderate", "Strong", "Core"][strength - 1] ?? "Moderate";

export default function RelationshipManagerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concepts: graphConcepts, connections, relationshipsFor, addRelationship, updateRelationship, removeRelationship, isReady } = useRelationshipStore();
  const concept = graphConcepts.find((candidate) => candidate.id === id) ?? findConcept(id ?? "adaptive-systems");
  const relationships = relationshipsFor(concept.id);
  const connectedIds = useMemo(() => new Set(relationships.map(({ otherConcept }) => otherConcept.id)), [relationships]);
  const candidates = useMemo(() => graphConcepts.filter((candidate) => candidate.id !== concept.id && !connectedIds.has(candidate.id)), [concept.id, connectedIds, graphConcepts]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(candidates[0]?.id);
  const [newRelationship, setNewRelationship] = useState<RelationshipType>("supports");
  const [newStrength, setNewStrength] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("All changes stay in this graph on this device.");

  useEffect(() => {
    if (selectedTargetId && candidates.some((candidate) => candidate.id === selectedTargetId)) return;
    setSelectedTargetId(candidates[0]?.id);
  }, [candidates, selectedTargetId]);

  const addSelectedRelationship = () => {
    if (!selectedTargetId) return;
    const target = graphConcepts.find((candidate) => candidate.id === selectedTargetId);
    addRelationship({ sourceId: concept.id, targetId: selectedTargetId, relationship: newRelationship, strength: newStrength, note: "" });
    setNotice(`${target?.title ?? "Concept"} linked locally.`);
    setEditingId(null);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={relationships}
        keyExtractor={(item) => item.connection.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.nav}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}><Text style={styles.back}>‹</Text></Pressable>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}><Text style={styles.doneText}>Done</Text></Pressable>
            </View>
            <Text style={styles.eyebrow}>CONCEPT CONNECTIONS</Text>
            <Text style={styles.title}>Manage relationships</Text>
            <Text style={styles.subtitle}>Shape how <Text style={styles.conceptName}>{concept.title}</Text> connects across your local graph.</Text>
            <View style={styles.summaryCard}>
              <View><Text style={styles.summaryNumber}>{relationships.length}</Text><Text style={styles.summaryLabel}>ACTIVE LINKS</Text></View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{isReady ? "Saved locally" : "Preparing local graph"}</Text><Text style={styles.summaryText}>{notice}</Text></View>
            </View>
            <Text style={styles.sectionLabel}>CURRENT RELATIONSHIPS</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RelationshipCard
            item={item}
            isEditing={editingId === item.connection.id}
            onToggle={() => setEditingId((current) => current === item.connection.id ? null : item.connection.id)}
            onUpdate={(changes) => {
              updateRelationship(item.connection.id, changes);
              setNotice(`Updated the relationship with ${item.otherConcept.title}.`);
            }}
            onRemove={() => {
              removeRelationship(item.connection.id);
              setEditingId(null);
              setNotice(`Removed the relationship with ${item.otherConcept.title}.`);
            }}
          />
        )}
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>No relationships yet</Text><Text style={styles.emptyText}>Choose a concept below to create the first local connection.</Text></View>}
        ListFooterComponent={
          <View style={styles.addCard}>
            <Text style={styles.addEyebrow}>NEW RELATIONSHIP</Text>
            <Text style={styles.addTitle}>Link another concept</Text>
            <Text style={styles.addText}>Choose a nearby concept, then describe the connection in your own graph.</Text>
            <Text style={styles.fieldLabel}>CONCEPT</Text>
            <View style={styles.targetList}>
              {candidates.map((candidate) => {
                const selected = candidate.id === selectedTargetId;
                return <Pressable key={candidate.id} onPress={() => setSelectedTargetId(candidate.id)} style={({ pressed }) => [styles.target, selected && styles.targetSelected, pressed && styles.pressed]}><View style={[styles.targetDot, { backgroundColor: candidate.color }]} /><Text style={[styles.targetText, selected && styles.targetTextSelected]}>{candidate.title}</Text><Text style={styles.targetKind}>{candidate.kind}</Text></Pressable>;
              })}
            </View>
            {selectedTargetId ? <>
              <RelationshipTypePicker value={newRelationship} onChange={setNewRelationship} />
              <StrengthPicker value={newStrength} onChange={setNewStrength} />
              <Pressable onPress={addSelectedRelationship} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addButtonText}>Link concept</Text><Text style={styles.addButtonArrow}>→</Text></Pressable>
            </> : <Text style={styles.completeText}>Every available concept is already connected.</Text>}
          </View>
        }
      />
    </View>
  );
}

function RelationshipCard({ item, isEditing, onToggle, onUpdate, onRemove }: { item: RelationshipView; isEditing: boolean; onToggle: () => void; onUpdate: (changes: { relationship?: RelationshipType; strength?: number; note?: string }) => void; onRemove: () => void }) {
  const { connection, otherConcept, isOutgoing } = item;
  const [note, setNote] = useState(connection.note);
  useEffect(() => setNote(connection.note), [connection.note]);
  return <View style={[styles.relationshipCard, isEditing && styles.relationshipCardOpen]}>
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.relationshipHead, pressed && styles.pressed]}>
      <View style={[styles.targetDot, styles.connectionDot, { backgroundColor: otherConcept.color }]} />
      <View style={styles.relationshipCopy}><Text style={styles.relationshipTitle}>{otherConcept.title}</Text><Text style={styles.relationshipDirection}>{isOutgoing ? "This concept" : otherConcept.title} <Text style={styles.relationshipVerb}>{connection.relationship}</Text> {isOutgoing ? otherConcept.title : "this concept"}</Text></View>
      <View style={styles.editPill}><Text style={styles.editPillText}>{isEditing ? "Close" : "Edit"}</Text></View>
    </Pressable>
    <View style={styles.strengthInfo}><Text style={styles.strengthText}>{strengthLabel(connection.strength)} link</Text><StrengthBars strength={connection.strength} /></View>
    {connection.note ? <Text style={noteStyles.preview} numberOfLines={2}>{connection.note}</Text> : null}
    {isEditing ? <View style={styles.editor}>
      <RelationshipTypePicker value={connection.relationship} onChange={(relationship) => onUpdate({ relationship })} compact />
      <StrengthPicker value={connection.strength} onChange={(strength) => onUpdate({ strength })} />
      <View style={noteStyles.editorGroup}><Text style={styles.fieldLabel}>RELATIONSHIP NOTE</Text><TextInput value={note} onChangeText={setNote} placeholder="Why does this link matter?" placeholderTextColor="#71809A" multiline maxLength={2000} textAlignVertical="top" style={noteStyles.input} /><Pressable onPress={() => onUpdate({ note })} style={({ pressed }) => [noteStyles.saveButton, pressed && styles.pressed]}><Text style={noteStyles.saveText}>Save note</Text></Pressable></View>
      <Pressable onPress={onRemove} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><Text style={styles.removeText}>Remove relationship</Text></Pressable>
    </View> : null}
  </View>;
}

function RelationshipTypePicker({ value, onChange, compact = false }: { value: RelationshipType; onChange: (type: RelationshipType) => void; compact?: boolean }) {
  return <View style={compact ? styles.compactPicker : styles.pickerSection}><Text style={styles.fieldLabel}>RELATIONSHIP TYPE</Text><View style={styles.chipRow}>{relationshipTypes.map((type) => <Pressable key={type} onPress={() => onChange(type)} style={({ pressed }) => [styles.typeChip, value === type && styles.typeChipActive, pressed && styles.pressed]}><Text style={[styles.typeText, value === type && styles.typeTextActive]}>{type}</Text></Pressable>)}</View></View>;
}

function StrengthPicker({ value, onChange }: { value: number; onChange: (strength: number) => void }) {
  return <View style={styles.pickerSection}><View style={styles.strengthHeading}><Text style={styles.fieldLabel}>CONNECTION STRENGTH</Text><Text style={styles.strengthLabel}>{strengthLabel(value)}</Text></View><View style={styles.strengthPicker}>{[1, 2, 3, 4, 5].map((strength) => <Pressable key={strength} onPress={() => onChange(strength)} style={({ pressed }) => [styles.strengthOption, value === strength && styles.strengthOptionActive, pressed && styles.pressed]}><Text style={[styles.strengthOptionText, value === strength && styles.strengthOptionTextActive]}>{strength}</Text></Pressable>)}</View></View>;
}

function StrengthBars({ strength }: { strength: number }) { return <View style={styles.bars}>{[1, 2, 3, 4, 5].map((bar) => <View key={bar} style={[styles.bar, bar <= strength && styles.barActive]} />)}</View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1020", paddingTop: 56 }, content: { paddingHorizontal: 20, paddingBottom: 54 }, nav: { height: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }, roundButton: { width: 42, height: 42, justifyContent: "center", alignItems: "center", borderRadius: 21, backgroundColor: "#151C2E" }, back: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, doneButton: { height: 42, paddingHorizontal: 17, borderRadius: 21, justifyContent: "center", backgroundColor: "#1D2143" }, doneText: { color: "#BDB7FF", fontSize: 14, fontWeight: "800" }, eyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 31, lineHeight: 37, letterSpacing: -0.6, fontWeight: "800", marginTop: 7 }, subtitle: { color: "#AEBBD1", fontSize: 15, lineHeight: 22, marginTop: 9 }, conceptName: { color: "#D4CEFF", fontWeight: "800" }, summaryCard: { minHeight: 83, borderRadius: 19, backgroundColor: "#151C2E", borderColor: "#293754", borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 26 }, summaryNumber: { color: "#F3F6FC", fontSize: 24, lineHeight: 27, fontWeight: "900" }, summaryLabel: { color: "#7B89A5", fontSize: 9, letterSpacing: 0.9, fontWeight: "900", marginTop: 3 }, summaryDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#2A3652", marginHorizontal: 14 }, summaryCopy: { flex: 1 }, summaryTitle: { color: "#63D2A3", fontSize: 12, fontWeight: "800" }, summaryText: { color: "#9BA8C1", fontSize: 11, lineHeight: 16, marginTop: 3 }, sectionLabel: { color: "#7C89A5", fontSize: 11, letterSpacing: 1.2, fontWeight: "800", marginBottom: 10 }, relationshipCard: { borderRadius: 19, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#293754", marginBottom: 10, overflow: "hidden" }, relationshipCardOpen: { borderColor: "#756BE5" }, relationshipHead: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 15 }, targetDot: { width: 10, height: 10, borderRadius: 5, marginRight: 11 }, connectionDot: { width: 12, height: 12, borderRadius: 6 }, relationshipCopy: { flex: 1 }, relationshipTitle: { color: "#EFF2F9", fontSize: 15, fontWeight: "800" }, relationshipDirection: { color: "#91A0B9", fontSize: 11, lineHeight: 16, marginTop: 3 }, relationshipVerb: { color: "#BEB8FF", fontWeight: "800" }, editPill: { height: 28, paddingHorizontal: 10, borderRadius: 14, justifyContent: "center", backgroundColor: "#222B44", marginLeft: 9 }, editPillText: { color: "#CBD2E1", fontSize: 11, fontWeight: "800" }, strengthInfo: { minHeight: 33, borderTopWidth: 1, borderTopColor: "#26314B", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, strengthText: { color: "#8593AD", fontSize: 11, fontWeight: "700" }, bars: { flexDirection: "row", gap: 3 }, bar: { height: 5, width: 11, borderRadius: 3, backgroundColor: "#293652" }, barActive: { backgroundColor: "#63D2A3" }, editor: { borderTopWidth: 1, borderTopColor: "#2A3652", padding: 15, backgroundColor: "#12192B" }, pickerSection: { marginTop: 18 }, compactPicker: { marginTop: 0 }, fieldLabel: { color: "#7C89A5", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginBottom: 8 }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, typeChip: { minHeight: 35, paddingHorizontal: 11, borderRadius: 10, justifyContent: "center", backgroundColor: "#1D2740", borderWidth: 1, borderColor: "#32405D" }, typeChipActive: { backgroundColor: "#343078", borderColor: "#8E84FF" }, typeText: { color: "#ABB8CD", fontSize: 11, fontWeight: "800" }, typeTextActive: { color: "#E7E4FF" }, strengthHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, strengthLabel: { color: "#63D2A3", fontSize: 11, fontWeight: "800", marginBottom: 8 }, strengthPicker: { flexDirection: "row", gap: 7 }, strengthOption: { flex: 1, height: 39, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#1D2740", borderWidth: 1, borderColor: "#32405D" }, strengthOptionActive: { backgroundColor: "#234B4C", borderColor: "#63D2A3" }, strengthOptionText: { color: "#9BA9C2", fontSize: 12, fontWeight: "900" }, strengthOptionTextActive: { color: "#A4F1CF" }, removeButton: { height: 44, borderRadius: 12, marginTop: 18, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#704051", backgroundColor: "#2A1A2A" }, removeText: { color: "#FF9EAE", fontSize: 13, fontWeight: "800" }, emptyCard: { borderRadius: 18, padding: 17, backgroundColor: "#131B2D", borderWidth: 1, borderStyle: "dashed", borderColor: "#3A4967", marginBottom: 12 }, emptyTitle: { color: "#EAF0FA", fontSize: 14, fontWeight: "800" }, emptyText: { color: "#94A2BC", fontSize: 12, lineHeight: 18, marginTop: 4 }, addCard: { marginTop: 17, borderRadius: 23, backgroundColor: "#11192B", borderColor: "#344261", borderWidth: 1, padding: 17 }, addEyebrow: { color: "#48D6E8", fontSize: 10, letterSpacing: 1.2, fontWeight: "900" }, addTitle: { color: "#F3F6FC", fontSize: 20, lineHeight: 25, fontWeight: "800", marginTop: 5 }, addText: { color: "#9EABC3", fontSize: 13, lineHeight: 19, marginTop: 5 }, targetList: { gap: 7 }, target: { minHeight: 47, borderRadius: 12, backgroundColor: "#172137", borderWidth: 1, borderColor: "#2D3A57", paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }, targetSelected: { backgroundColor: "#27235A", borderColor: "#8A80F3" }, targetText: { flex: 1, color: "#DDE4F0", fontSize: 13, fontWeight: "800" }, targetTextSelected: { color: "#FBFAFF" }, targetKind: { color: "#8795AF", fontSize: 10, fontWeight: "700" }, addButton: { minHeight: 49, borderRadius: 14, marginTop: 20, backgroundColor: "#7C6CFF", paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, addButtonArrow: { color: "#FFFFFF", fontSize: 21, lineHeight: 21 }, completeText: { color: "#63D2A3", fontSize: 13, fontWeight: "800", marginTop: 20, textAlign: "center" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});

const noteStyles = StyleSheet.create({
  preview: { color: "#AAB7CD", fontSize: 12, lineHeight: 18, paddingHorizontal: 15, paddingBottom: 12 },
  editorGroup: { marginTop: 18 },
  input: { minHeight: 94, borderRadius: 12, padding: 12, color: "#EAF0FA", fontSize: 13, lineHeight: 19, backgroundColor: "#0E1627", borderWidth: 1, borderColor: "#30405E" },
  saveButton: { height: 40, alignSelf: "flex-end", marginTop: 9, paddingHorizontal: 13, justifyContent: "center", borderRadius: 10, backgroundColor: "#27235A" },
  saveText: { color: "#D9D5FF", fontSize: 12, fontWeight: "900" },
});
