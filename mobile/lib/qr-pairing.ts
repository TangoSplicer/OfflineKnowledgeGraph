import QRCode from "qrcode";
import { getOrCreateTrustedDevice } from "./trusted-devices";

export type DevicePairingPayload = {
  schemaVersion: 1;
  scope: "trusted-device-pairing";
  deviceId: string;
  label: string;
  platform: string;
  createdAt: string;
};

export async function generateDevicePairingPayload(): Promise<string> {
  const device = await getOrCreateTrustedDevice();
  const payload: DevicePairingPayload = {
    schemaVersion: 1,
    scope: "trusted-device-pairing",
    deviceId: device.id,
    label: device.label,
    platform: device.platform,
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export function createPairingQrModules(payload: string): boolean[][] {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  return qr.modules.data.reduce<boolean[][]>((rows, value, index) => {
    const size = qr.modules.size;
    if (index % size === 0) rows.push([]);
    rows[rows.length - 1].push(Boolean(value));
    return rows;
  }, []);
}

export function parseDevicePairingPayload(raw: string): DevicePairingPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The scanned QR payload is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || (parsed as DevicePairingPayload).scope !== "trusted-device-pairing") {
    throw new Error("This QR code is not a compatible Offline Knowledge Graph trusted-device pairing token.");
  }
  const payload = parsed as DevicePairingPayload;
  if (!payload.deviceId || !payload.label) {
    throw new Error("The device pairing token is missing required identity fields.");
  }
  return payload;
}
