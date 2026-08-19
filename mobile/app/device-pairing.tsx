import { Stack, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { confirmSensitiveSyncAction } from "@/lib/biometric-gate";
import { createPairingQrModules, generateDevicePairingPayload, parseDevicePairingPayload, type DevicePairingPayload } from "@/lib/qr-pairing";
import { adjacentTransport } from "@/lib/adjacent-transport";
import { parseAdjacentPairingToken, type PairingTransport } from "@/lib/adjacent-pairing";

export default function DevicePairingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [payload, setPayload] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [remoteDevice, setRemoteDevice] = useState<DevicePairingPayload | null>(null);
  const [reviewTransport, setReviewTransport] = useState<PairingTransport>("fallback-qr");
  const [adjacentTransportMode, setAdjacentTransportMode] = useState<Exclude<PairingTransport, "fallback-qr">>("wifi");
  const [adjacentToken, setAdjacentToken] = useState("");
  const [nearbyPeers, setNearbyPeers] = useState<{ id: string; label: string; platform: string; transport: PairingTransport; rawToken: string; discoveredAt: number; rssi?: number }[]>([]);
  const [scanningNearby, setScanningNearby] = useState(false);
  const [broadcastingNearby, setBroadcastingNearby] = useState(false);
  const usedAdjacentNonces = useRef(new Set<string>());
  const [status, setStatus] = useState("Pair only with a device you recognize. QR and adjacent tokens contain identity metadata, not graph data or a passphrase.");
  const modules = useMemo(() => payload ? createPairingQrModules(payload) : [], [payload]);

  useEffect(() => { void generateDevicePairingPayload().then(setPayload).catch(() => setStatus("Unable to prepare this device’s pairing token.")); return () => { void adjacentTransport.stopBroadcasting(); }; }, []);

  const inspectToken = (raw: string) => {
    try { setReviewTransport("fallback-qr"); setRemoteDevice(parseDevicePairingPayload(raw)); setStatus("Device identity verified locally. Confirm only if this is the device you intended to trust."); setScanning(false); }
    catch (error) { setRemoteDevice(null); setStatus(error instanceof Error ? error.message : "Unable to read that pairing token."); }
  };

  const inspectAdjacentToken = (raw: string) => {
    try {
      const token = adjacentTransport.consumePeerToken(raw, usedAdjacentNonces.current);
      setReviewTransport(token.transport);
      setRemoteDevice({ schemaVersion: 1, scope: "trusted-device-pairing", deviceId: token.deviceId, label: token.label, platform: token.platform, createdAt: new Date(token.createdAt).toISOString() });
      setStatus(`${token.transport === "bluetooth" ? "Bluetooth" : "Local Wi-Fi"} token received. Review the identity before trusting it.`);
    } catch (error) { setRemoteDevice(null); setStatus(error instanceof Error ? error.message : "Unable to read that adjacent pairing token."); }
  };

  const advertiseNearby = async () => {
    if (!payload) return;
    try {
      const local = JSON.parse(payload) as DevicePairingPayload;
      setBroadcastingNearby(true);
      await adjacentTransport.startBroadcasting(local.deviceId, local.label, adjacentTransportMode, setAdjacentToken);
      setStatus(`Advertising a two-minute ${adjacentTransportMode === "bluetooth" ? "Bluetooth" : "local Wi-Fi"} token. Keep this screen open while the other device scans.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to advertise an adjacent pairing token."); setBroadcastingNearby(false); }
  };

  const scanNearby = async () => {
    try {
      setScanningNearby(true); setNearbyPeers([]);
      const peers = await adjacentTransport.scanForNearbyPeers(adjacentTransportMode);
      setNearbyPeers(peers);
      setStatus(peers.length ? `Found ${peers.length} nearby device${peers.length === 1 ? "" : "s"}. Review one before trusting it.` : "No nearby pairing tokens were found. Confirm both devices are close, unlocked, and advertising.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Nearby pairing is unavailable on this build. Use QR or manual token review."); }
    finally { setScanningNearby(false); }
  };

  const scan = ({ data }: BarcodeScanningResult) => { if (!scanning) return; inspectToken(data); };
  const trustRemoteDevice = async () => {
    if (!remoteDevice) return;
    const gate = await confirmSensitiveSyncAction(`Approve ${remoteDevice.label} for a nearby local transfer`);
    if (!gate.allowed) { setStatus(gate.message); return; }
    setStatus(`${remoteDevice.label} is approved for this nearby transfer. Send the protected bundle separately from Knowledge exchange.`);
    setRemoteDevice(null);
  };

  return <ScreenContainer containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><ScrollView contentContainerStyle={styles.content}><View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>NEARBY TRANSFER</Text><Text style={styles.title}>Pair with QR</Text></View></View><View style={styles.hero}><Text style={styles.heroTitle}>No graph data in the code</Text><Text style={styles.heroText}>This pairing token identifies a nearby device for one local transfer. Keep your passphrase separate and never place it in a QR code.</Text></View><View style={styles.qrCard}><Text style={styles.sectionLabel}>THIS DEVICE</Text><Text style={styles.qrHint}>Show this code on the device you want to exchange with, then scan its code here.</Text><View style={styles.qrFrame}>{modules.map((row, rowIndex) => <View key={`r-${rowIndex}`} style={styles.qrRow}>{row.map((filled, columnIndex) => <View key={`c-${columnIndex}`} style={[styles.qrCell, filled && styles.qrFilled]} />)}</View>)}</View><Text style={styles.deviceFootnote}>Pairing tokens are local identity metadata only.</Text></View><View style={styles.adjacentCard}><Text style={styles.sectionLabel}>ADJACENT DEVICE EXCHANGE</Text><Text style={styles.adjacentHint}>Exchange a two-minute identity token directly with a nearby device over the same Wi-Fi network or Bluetooth LE. The token never contains graph data or a passphrase.</Text><View style={styles.modeRow}><Pressable onPress={() => setAdjacentTransportMode("wifi")} style={({ pressed }) => [styles.modeChip, adjacentTransportMode === "wifi" && styles.modeChipActive, pressed && styles.pressed]}><Text style={[styles.modeText, adjacentTransportMode === "wifi" && styles.modeTextActive]}>Local Wi-Fi</Text></Pressable><Pressable onPress={() => setAdjacentTransportMode("bluetooth")} style={({ pressed }) => [styles.modeChip, adjacentTransportMode === "bluetooth" && styles.modeChipActive, pressed && styles.pressed]}><Text style={[styles.modeText, adjacentTransportMode === "bluetooth" && styles.modeTextActive]}>Bluetooth LE</Text></Pressable></View><View style={styles.adjacentActions}><Pressable onPress={() => void advertiseNearby()} style={({ pressed }) => [styles.adjacentAction, pressed && styles.pressed]}><Text style={styles.adjacentActionText}>{broadcastingNearby ? "Advertising…" : "Advertise nearby"}</Text></Pressable><Pressable onPress={() => void scanNearby()} style={({ pressed }) => [styles.adjacentAction, styles.adjacentActionAlt, pressed && styles.pressed]}><Text style={styles.adjacentActionText}>{scanningNearby ? "Scanning…" : "Find nearby"}</Text></Pressable></View>{adjacentToken ? <Text style={styles.adjacentActive}>Ephemeral token active · expires in 2 minutes · keep this screen open.</Text> : null}{nearbyPeers.map((peer) => <Pressable key={`${peer.transport}-${peer.id}`} onPress={() => inspectAdjacentToken(peer.rawToken)} style={({ pressed }) => [styles.peerRow, pressed && styles.pressed]}><View style={styles.peerCopy}><Text style={styles.peerTitle}>{peer.label}</Text><Text style={styles.peerMeta}>{peer.transport === "bluetooth" ? "Bluetooth LE" : "Local Wi-Fi"} · {peer.platform}{typeof peer.rssi === "number" ? ` · ${peer.rssi} dBm` : ""}</Text></View><Text style={styles.peerAction}>Review ›</Text></Pressable>)}</View><View style={styles.scanCard}><Text style={styles.sectionLabel}>REVIEW A NEARBY DEVICE</Text>{Platform.OS !== "web" && scanning ? <View style={styles.cameraFrame}><CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scan} /><View style={styles.scanReticle} /></View> : null}{Platform.OS !== "web" && !scanning ? <Pressable onPress={() => { setScanning(true); void requestPermission(); }} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{permission?.granted ? "Open QR scanner" : "Allow camera & scan"}</Text></Pressable> : null}{Platform.OS === "web" ? <Text style={styles.webHint}>Camera scanning is available in the Android build. For web development, paste the QR payload below.</Text> : null}<TextInput value={manualToken} onChangeText={setManualToken} multiline autoCapitalize="none" autoCorrect={false} style={styles.tokenInput} placeholder="Paste a pairing token for review" placeholderTextColor="#71839F" /><Pressable onPress={() => inspectToken(manualToken)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Review pairing token</Text></Pressable>{remoteDevice ? <View style={styles.review}><Text style={styles.reviewEyebrow}>IDENTITY REVIEW</Text><Text style={styles.reviewTitle}>{remoteDevice.label}</Text><Text style={styles.reviewMeta}>{remoteDevice.platform} · {remoteDevice.deviceId}</Text><Text style={styles.reviewBody}>Confirming this device only approves the nearby transfer you initiate. Transfer a protected bundle separately with your own passphrase.</Text><Pressable onPress={() => void trustRemoteDevice()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Approve nearby device</Text></Pressable></View> : null}</View><Text style={styles.status}>{status}</Text></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 }, nav: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#151C2E" }, backText: { color: "#F3F6FC", fontSize: 33, lineHeight: 35, marginTop: -3 }, eyebrow: { color: "#78DAE5", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, title: { color: "#F3F6FC", fontSize: 22, fontWeight: "800", marginTop: 3 }, hero: { borderRadius: 17, padding: 14, backgroundColor: "#1C2348", borderWidth: 1, borderColor: "#625BB7" }, heroTitle: { color: "#ECEAFF", fontSize: 13, fontWeight: "900" }, heroText: { color: "#B9B5DF", fontSize: 11, lineHeight: 17, marginTop: 5 }, qrCard: { borderRadius: 17, padding: 14, marginTop: 10, alignItems: "center", backgroundColor: "#142537", borderWidth: 1, borderColor: "#365A75" }, sectionLabel: { alignSelf: "stretch", color: "#8392AE", fontSize: 9, letterSpacing: 1, fontWeight: "900", marginBottom: 6 }, qrHint: { alignSelf: "stretch", color: "#A9B9CF", fontSize: 11, lineHeight: 16 }, qrFrame: { marginTop: 13, padding: 10, backgroundColor: "#FFFFFF", borderRadius: 8 }, qrRow: { flexDirection: "row" }, qrCell: { width: 4, height: 4, backgroundColor: "#FFFFFF" }, qrFilled: { backgroundColor: "#101728" }, deviceFootnote: { color: "#7790A6", fontSize: 9, marginTop: 9 }, adjacentCard: { borderRadius: 17, padding: 14, marginTop: 10, backgroundColor: "#112C3A", borderWidth: 1, borderColor: "#397182" }, adjacentHint: { color: "#A9CBD1", fontSize: 11, lineHeight: 17 }, modeRow: { flexDirection: "row", gap: 7, marginTop: 11 }, modeChip: { flex: 1, minHeight: 34, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#183544", borderWidth: 1, borderColor: "#2C5D6B" }, modeChipActive: { backgroundColor: "#2C6670", borderColor: "#7BE2EA" }, modeText: { color: "#8FB4BE", fontSize: 10, fontWeight: "800" }, modeTextActive: { color: "#E0FBFD" }, adjacentActions: { flexDirection: "row", gap: 7, marginTop: 8 }, adjacentAction: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#347985" }, adjacentActionAlt: { backgroundColor: "#245466" }, adjacentActionText: { color: "#ECFEFF", fontSize: 10, fontWeight: "900" }, adjacentActive: { color: "#8FE4E5", fontSize: 9, lineHeight: 14, marginTop: 9 }, peerRow: { minHeight: 54, marginTop: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "#183A47", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, peerCopy: { flex: 1 }, peerTitle: { color: "#E8FBFC", fontSize: 11, fontWeight: "900" }, peerMeta: { color: "#91B9C3", fontSize: 9, marginTop: 3 }, peerAction: { color: "#94E7EB", fontSize: 10, fontWeight: "900", marginLeft: 10 }, scanCard: { borderRadius: 17, padding: 14, marginTop: 10, backgroundColor: "#151C2E", borderWidth: 1, borderColor: "#2C3D5B" }, primary: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#6E64D9", paddingHorizontal: 10, marginTop: 8 }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, secondary: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#224A58", paddingHorizontal: 10, marginTop: 8 }, secondaryText: { color: "#D9F4F5", fontSize: 10, fontWeight: "900" }, cameraFrame: { height: 260, overflow: "hidden", borderRadius: 14, backgroundColor: "#09111F", marginBottom: 8 }, scanReticle: { position: "absolute", width: 170, height: 170, borderRadius: 18, borderWidth: 2, borderColor: "#7BE2EA", alignSelf: "center", top: 45 }, webHint: { color: "#8192AA", fontSize: 10, lineHeight: 15, marginBottom: 7 }, tokenInput: { minHeight: 72, borderRadius: 11, padding: 11, color: "#EEF3FC", backgroundColor: "#101827", borderWidth: 1, borderColor: "#3B506F", fontSize: 11, textAlignVertical: "top" }, review: { marginTop: 10, borderRadius: 13, padding: 12, backgroundColor: "#20254A", borderWidth: 1, borderColor: "#655DB0" }, reviewEyebrow: { color: "#C3BCFF", fontSize: 9, letterSpacing: 1, fontWeight: "900" }, reviewTitle: { color: "#F3F1FF", fontSize: 16, fontWeight: "900", marginTop: 5 }, reviewMeta: { color: "#A9A3D2", fontSize: 9, marginTop: 3 }, reviewBody: { color: "#C0BCE0", fontSize: 10, lineHeight: 15, marginTop: 8 }, status: { color: "#8292AB", fontSize: 10, lineHeight: 16, marginTop: 12 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
