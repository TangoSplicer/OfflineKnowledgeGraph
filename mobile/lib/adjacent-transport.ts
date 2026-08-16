import { consumeAdjacentPairingToken, createAdjacentPairingToken, parseAdjacentPairingToken, type AdjacentPairingToken, type PairingTransport } from "./adjacent-pairing";

export const ADJACENT_WIFI_SERVICE = "okgpair";
export const ADJACENT_BLUETOOTH_SERVICE_UUID = "4f4b4750-4149-5250-4149-52494e544f4b";
export const ADJACENT_BLUETOOTH_CHARACTERISTIC_UUID = "4f4b4750-4149-5250-4149-52544f4b454e";
const ADJACENT_WIFI_PORT = 41557;
const ADJACENT_BUNDLE_REQUEST_PREFIX = "OKG_BUNDLE_V1:";
export const ADJACENT_BLUETOOTH_BUNDLE_CHARACTERISTIC_UUID = "4f4b4750-4149-5250-4149-52424e4e444c";
const MAX_BLUETOOTH_BUNDLE_HEX_LENGTH = 3_600;

type ZeroconfInstance = {
  on: (event: string, callback: (value: any) => void) => void;
  removeListener?: (event: string, callback: (value: any) => void) => void;
  scan: (type: string, protocol: string, domain: string, implementation?: string) => void;
  stop: (implementation?: string) => void;
  publishService?: (type: string, protocol: string, domain: string, name: string, port: number, txt?: Record<string, string>, implementation?: string) => void;
  unpublishService?: (name: string, implementation?: string) => void;
  removeDeviceListeners?: () => void;
};

type BluetoothDevice = { id: string; name?: string; localName?: string; serviceUUIDs?: string[]; rssi?: number };
type TcpSocket = { on: (event: string, callback: (value?: any) => void) => void; write: (value: string) => boolean; end: () => void; destroy: () => void; setTimeout?: (timeout: number, callback?: () => void) => TcpSocket };
type TcpServer = { on: (event: string, callback: (value?: any) => void) => void; listen: (options: { port: number; host: string }, callback?: () => void) => void; close: (callback?: () => void) => void; address: () => { port?: number } | string | null };
type TcpModule = { createServer: (listener: (socket: TcpSocket) => void) => TcpServer; createConnection: (options: { port: number; host: string; interface?: "wifi" | "cellular" | "ethernet" }, callback?: () => void) => TcpSocket };

type BluetoothModule = {
  requestBluetoothPermission: (permissions?: ("scan" | "connect" | "advertise")[]) => Promise<boolean>;
  startAdvertising: (options: { serviceUUIDs: string[]; localName?: string; advertisingData?: Record<string, unknown> }) => void;
  stopAdvertising: () => void;
  setServices: (services: { uuid: string; characteristics: { uuid: string; properties: string[]; permissions?: string[]; value?: string }[] }[], options?: { mode?: "automatic" | "manual"; timeoutMs?: number }) => void;
  startScan: (options?: { serviceUUIDs?: string[]; allowDuplicates?: boolean; scanMode?: "lowPower" | "balanced" | "lowLatency" }) => void;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: (deviceId: string) => void;
  discoverServices: (deviceId: string) => Promise<unknown[]>;
  readCharacteristic: (deviceId: string, serviceUUID: string, characteristicUUID: string) => Promise<{ value: string }>;
  addDeviceFoundListener: (callback: (device: BluetoothDevice) => void) => () => void;
  addEventListener: (event: string, callback: (value: any) => void) => () => void;
};

export type DiscoveredPeerDevice = {
  id: string;
  label: string;
  platform: string;
  transport: PairingTransport;
  rawToken: string;
  discoveredAt: number;
  rssi?: number;
  endpoint?: { host: string; port: number };
  bundleAvailable?: boolean;
  bluetoothBundle?: string;
};

const getPlatform = () => {
  try { return (require("react-native") as { Platform: { OS: string } }).Platform.OS; } catch { return "web"; }
};

const loadZeroconf = (): (new () => ZeroconfInstance) | null => {
  if (getPlatform() === "web") return null;
  try {
    const loaded = require("react-native-zeroconf") as { default?: new () => ZeroconfInstance } | (new () => ZeroconfInstance);
    return typeof loaded === "function" ? loaded : loaded.default ?? null;
  } catch { return null; }
};

const loadTcpSocket = (): TcpModule | null => {
  if (getPlatform() === "web") return null;
  try { return require("react-native-tcp-socket") as TcpModule; } catch { return null; }
};

const loadBluetooth = (): BluetoothModule | null => {
  if (getPlatform() === "web") return null;
  try { return require("munim-bluetooth") as BluetoothModule; } catch { return null; }
};

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = typeof atob === "function" ? atob(normalized) : Buffer.from(normalized, "base64").toString("binary");
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
};

const toText = (value: unknown) => value instanceof Uint8Array ? new TextDecoder().decode(value) : typeof value === "string" ? value : String(value ?? "");
const encodeHex = (value: string) => Array.from(new TextEncoder().encode(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
const decodeHex = (value: string) => new TextDecoder().decode(Uint8Array.from(value.match(/.{1,2}/g) ?? [], (pair) => Number.parseInt(pair, 16)));

export class AdjacentTransportManager {
  private activeToken: { token: string; transport: PairingTransport; timer: ReturnType<typeof setInterval> } | null = null;
  private zeroconf: ZeroconfInstance | null = null;
  private wifiServiceName: string | null = null;
  private bluetooth: BluetoothModule | null = null;
  private tcpServer: TcpServer | null = null;
  private activeBundle: string | null = null;

  public async startBroadcasting(deviceId: string, label: string, transport: PairingTransport = "wifi", onRefresh?: (token: string) => void): Promise<string> {
    await this.stopBroadcasting();
    const publish = async () => {
      const token = createAdjacentPairingToken(deviceId, label, getPlatform(), transport);
      this.activeToken = { token, transport, timer };
      onRefresh?.(token);
      if (transport === "wifi") await this.publishWifiToken(token, label);
      if (transport === "bluetooth") await this.publishBluetoothToken(token, label);
      return token;
    };
    let timer = setInterval(() => { void publish(); }, 90_000);
    this.activeToken = { token: "", transport, timer };
    return publish();
  }

  public async startEncryptedBundleBroadcast(deviceId: string, label: string, bundle: string, transport: Exclude<PairingTransport, "fallback-qr"> = "wifi", onRefresh?: (token: string) => void): Promise<string> {
    await this.stopBroadcasting();
    this.activeBundle = bundle;
    const publish = async () => {
      const token = createAdjacentPairingToken(deviceId, label, getPlatform(), transport);
      this.activeToken = { token, transport, timer };
      onRefresh?.(token);
      if (transport === "wifi") await this.publishWifiToken(token, label, bundle);
      if (transport === "bluetooth") await this.publishBluetoothToken(token, label, bundle);
      return token;
    };
    const timer = setInterval(() => { void publish(); }, 90_000);
    this.activeToken = { token: "", transport, timer };
    return publish();
  }

  public async requestEncryptedBundle(peer: DiscoveredPeerDevice): Promise<string> {
    if (peer.transport === "wifi") {
      if (!peer.endpoint || !peer.bundleAvailable) throw new Error("This nearby device is not offering a Wi-Fi backup bundle.");
      const tcp = loadTcpSocket();
      if (!tcp) throw new Error("Direct Wi-Fi transfer requires the installed Android development build.");
      return new Promise((resolve, reject) => {
        const socket = tcp.createConnection({ host: peer.endpoint!.host, port: peer.endpoint!.port, interface: "wifi" }, () => {
          socket.write(`${ADJACENT_BUNDLE_REQUEST_PREFIX}${encodeBase64Url(peer.rawToken)}\\n`);
        });
        let settled = false;
        let response = "";
        const finish = (error?: Error) => { if (settled) return; settled = true; try { socket.destroy(); } catch { /* no-op */ } error ? reject(error) : response ? resolve(response) : reject(new Error("The nearby device returned an empty encrypted bundle.")); };
        socket.on("data", (data) => { response += toText(data); if (response.length > 1_000_000) finish(new Error("The encrypted bundle exceeds the safe transfer limit.")); });
        socket.on("error", (error) => finish(error instanceof Error ? error : new Error("The local Wi-Fi transfer failed.")));
        socket.on("close", () => finish());
        socket.on("end", () => finish());
        socket.setTimeout?.(15_000, () => finish(new Error("The nearby device did not respond in time.")));
      });
    }
    if (peer.transport === "bluetooth") {
      if (peer.bluetoothBundle) return peer.bluetoothBundle;
      const bluetooth = loadBluetooth();
      if (!bluetooth) throw new Error("Bluetooth transfer requires the installed Android development build.");
      await bluetooth.connect(peer.id);
      await bluetooth.discoverServices(peer.id);
      try { const value = await bluetooth.readCharacteristic(peer.id, ADJACENT_BLUETOOTH_SERVICE_UUID, ADJACENT_BLUETOOTH_BUNDLE_CHARACTERISTIC_UUID); return decodeHex(value.value); } finally { try { bluetooth.disconnect(peer.id); } catch { /* no-op */ } }
    }
    throw new Error("Choose Wi-Fi or Bluetooth for adjacent encrypted transfer.");
  }

  public async stopBroadcasting() {
    if (this.activeToken?.timer) clearInterval(this.activeToken.timer);
    this.activeToken = null;
    if (this.zeroconf) {
      try { if (this.wifiServiceName) this.zeroconf.unpublishService?.(this.wifiServiceName, "DNSSD"); this.zeroconf.stop("DNSSD"); this.zeroconf.removeDeviceListeners?.(); } catch { /* native adapter unavailable */ }
    }
    this.zeroconf = null;
    this.wifiServiceName = null;
    if (this.tcpServer) { try { this.tcpServer.close(); } catch { /* no-op */ } }
    this.tcpServer = null;
    this.activeBundle = null;
    if (this.bluetooth) { try { this.bluetooth.stopAdvertising(); } catch { /* adapter unavailable */ } }
    this.bluetooth = null;
  }

  public async scanForNearbyPeers(preferredTransport: Exclude<PairingTransport, "fallback-qr">): Promise<DiscoveredPeerDevice[]> {
    if (preferredTransport === "wifi") return this.scanWifiPeers();
    return this.scanBluetoothPeers();
  }

  public consumePeerToken(rawToken: string, usedNonces: Set<string>, now = Date.now()): AdjacentPairingToken {
    return consumeAdjacentPairingToken(rawToken, usedNonces, now);
  }

  private async startTcpBundleServer(bundle: string): Promise<number> {
    const tcp = loadTcpSocket();
    if (!tcp) throw new Error("Direct Wi-Fi transfer requires the installed Android development build.");
    if (this.tcpServer) { try { this.tcpServer.close(); } catch { /* no-op */ } }
    return new Promise((resolve, reject) => {
      const server = tcp.createServer((socket) => {
        let request = "";
        socket.on("data", (data) => {
          request += toText(data);
          if (!request.includes("\\n")) return;
          const encoded = request.trim().slice(ADJACENT_BUNDLE_REQUEST_PREFIX.length);
          let valid = request.trim().startsWith(ADJACENT_BUNDLE_REQUEST_PREFIX) && Boolean(this.activeToken?.token);
          try {
            const requestedToken = decodeBase64Url(encoded);
            parseAdjacentPairingToken(requestedToken);
            valid = valid && requestedToken === this.activeToken?.token;
          } catch { valid = false; }
          socket.write(valid ? bundle : "ERROR:INVALID_PAIRING_TOKEN");
          socket.end();
        });
        socket.on("error", () => { try { socket.destroy(); } catch { /* no-op */ } });
      });
      server.on("error", (error) => reject(error instanceof Error ? error : new Error("Unable to open the local Wi-Fi transfer port.")));
      server.listen({ port: 0, host: "0.0.0.0" }, () => {
        const address = server.address();
        const port = typeof address === "object" && address?.port ? address.port : 0;
        if (!port) { reject(new Error("The local Wi-Fi transfer port could not be assigned.")); return; }
        this.tcpServer = server;
        resolve(port);
      });
    });
  }

  private async publishWifiToken(token: string, label: string, bundle?: string) {
    const Zeroconf = loadZeroconf();
    if (!Zeroconf) throw new Error("Local Wi-Fi pairing is available in the native development build, not in web preview or Expo Go.");
    const instance = this.zeroconf ?? new Zeroconf();
    this.zeroconf = instance;
    this.wifiServiceName = `Offline Knowledge Graph ${label.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 24)}`;
    const port = bundle ? await this.startTcpBundleServer(bundle) : ADJACENT_WIFI_PORT;
    instance.publishService?.(ADJACENT_WIFI_SERVICE, "tcp", "local.", this.wifiServiceName, port, { v: "1", token: encodeBase64Url(token), bundle: bundle ? "tcp" : "token" }, "DNSSD");
  }

  private async publishBluetoothToken(token: string, label: string, bundle?: string) {
    const bluetooth = loadBluetooth();
    if (!bluetooth) throw new Error("Bluetooth pairing is available in the native development build, not in web preview or Expo Go.");
    const permitted = await bluetooth.requestBluetoothPermission(["advertise", "connect"]);
    if (!permitted) throw new Error("Bluetooth permission was not granted.");
    this.bluetooth = bluetooth;
    const bundleHex = bundle ? encodeHex(bundle) : "";
    const characteristics = [{ uuid: ADJACENT_BLUETOOTH_CHARACTERISTIC_UUID, properties: ["read"], permissions: ["readEncrypted"], value: encodeHex(token) }];
    if (bundle && bundleHex.length <= MAX_BLUETOOTH_BUNDLE_HEX_LENGTH) characteristics.push({ uuid: ADJACENT_BLUETOOTH_BUNDLE_CHARACTERISTIC_UUID, properties: ["read"], permissions: ["readEncrypted"], value: bundleHex });
    bluetooth.setServices([{ uuid: ADJACENT_BLUETOOTH_SERVICE_UUID, characteristics }]);
    bluetooth.startAdvertising({ serviceUUIDs: [ADJACENT_BLUETOOTH_SERVICE_UUID], localName: `OKG ${label.slice(0, 16)}` });
  }

  private scanWifiPeers(): Promise<DiscoveredPeerDevice[]> {
    const Zeroconf = loadZeroconf();
    if (!Zeroconf) return Promise.reject(new Error("Local Wi-Fi scanning is available in the native development build, not in web preview or Expo Go."));
    const instance = new Zeroconf();
    this.zeroconf = instance;
    return new Promise((resolve, reject) => {
      const peers: DiscoveredPeerDevice[] = [];
      const onResolved = (service: any) => {
        const encoded = typeof service?.txt?.token === "string" ? service.txt.token : "";
        if (!encoded) return;
        try {
              const rawToken = decodeBase64Url(encoded);
              const token = parseAdjacentPairingToken(rawToken);
              const host = Array.isArray(service?.addresses) ? service.addresses[0] : (typeof service?.host === "string" ? service.host : "");
              const port = Number(service?.port);
              if (!peers.some((peer) => peer.id === token.deviceId)) peers.push({ id: token.deviceId, label: token.label, platform: token.platform, transport: "wifi", rawToken, discoveredAt: Date.now(), endpoint: host && Number.isFinite(port) ? { host, port } : undefined, bundleAvailable: service?.txt?.bundle === "tcp" });
        } catch { /* ignore expired or malformed advertisements */ }
      };
      const onError = (error: Error) => { cleanup(); reject(error); };
      const cleanup = () => { try { instance.stop("DNSSD"); instance.removeListener?.("resolved", onResolved); instance.removeListener?.("error", onError); } catch { /* no-op */ } };
      instance.on("resolved", onResolved);
      instance.on("error", onError);
      instance.scan(ADJACENT_WIFI_SERVICE, "tcp", "local.", "DNSSD");
      setTimeout(() => { cleanup(); resolve(peers); }, 8_000);
    });
  }

  private scanBluetoothPeers(): Promise<DiscoveredPeerDevice[]> {
    const bluetooth = loadBluetooth();
    if (!bluetooth) return Promise.reject(new Error("Bluetooth scanning is available in the native development build, not in web preview or Expo Go."));
    return new Promise(async (resolve, reject) => {
      try {
        const permitted = await bluetooth.requestBluetoothPermission(["scan", "connect"]);
        if (!permitted) throw new Error("Bluetooth permission was not granted.");
        const peers: DiscoveredPeerDevice[] = [];
        const removeListener = bluetooth.addDeviceFoundListener((device) => {
          if (!device.serviceUUIDs?.some((uuid) => uuid.toLowerCase() === ADJACENT_BLUETOOTH_SERVICE_UUID)) return;
          void (async () => {
            try {
              await bluetooth.connect(device.id);
              await bluetooth.discoverServices(device.id);
              const value = await bluetooth.readCharacteristic(device.id, ADJACENT_BLUETOOTH_SERVICE_UUID, ADJACENT_BLUETOOTH_CHARACTERISTIC_UUID);
              const rawToken = decodeHex(value.value);
              const token = parseAdjacentPairingToken(rawToken);
              let bluetoothBundle: string | undefined;
              try { bluetoothBundle = decodeHex((await bluetooth.readCharacteristic(device.id, ADJACENT_BLUETOOTH_SERVICE_UUID, ADJACENT_BLUETOOTH_BUNDLE_CHARACTERISTIC_UUID)).value); } catch { /* token-only peer */ }
              if (!peers.some((peer) => peer.id === token.deviceId)) peers.push({ id: token.deviceId, label: token.label, platform: token.platform, transport: "bluetooth", rawToken, discoveredAt: Date.now(), rssi: device.rssi, bundleAvailable: Boolean(bluetoothBundle), bluetoothBundle });
            } catch { /* ignore devices that cannot complete the encrypted read */ }
          })();
        });
        bluetooth.startScan({ serviceUUIDs: [ADJACENT_BLUETOOTH_SERVICE_UUID], allowDuplicates: false, scanMode: "balanced" });
        setTimeout(() => { bluetooth.stopScan(); removeListener(); resolve(peers); }, 8_000);
      } catch (error) { try { bluetooth.stopScan(); } catch { /* no-op */ } reject(error); }
    });
  }
}

export const adjacentTransport = new AdjacentTransportManager();
