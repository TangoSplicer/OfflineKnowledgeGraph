import { decryptCompleteGraph, encryptCompleteGraph , previewGraphSyncConflict, resolveGraphSyncConflict } from "./encrypted-graph-sync";
import { createGraphBackup, type GraphBackup } from "./relationship-backup";

export type PeerEncryptedBundle = {
  schemaVersion: 1;
  scope: "peer-encrypted-bundle";
  createdAt: string;
  senderLabel: string;
  envelope: string;
};

export async function exportPeerEncryptedBundle(concepts: any[], connections: any[], senderLabel: string, passphrase: string): Promise<string> {
  const backup = createGraphBackup(concepts, connections);
  const envelope = await encryptCompleteGraph(backup.concepts, backup.connections, passphrase);
  const bundle: PeerEncryptedBundle = {
    schemaVersion: 1,
    scope: "peer-encrypted-bundle",
    createdAt: new Date().toISOString(),
    senderLabel: senderLabel.trim() || "Trusted peer device",
    envelope: JSON.stringify(envelope),
  };
  return JSON.stringify(bundle, null, 2);
}

export async function parseAndPreviewPeerBundle(rawBundle: string, passphrase: string, localConcepts: any[], localConnections: any[]) {
  const bundle = JSON.parse(rawBundle) as PeerEncryptedBundle;
  if (!bundle || bundle.schemaVersion !== 1 || bundle.scope !== "peer-encrypted-bundle") {
    throw new Error("This file is not a compatible encrypted peer exchange bundle.");
  }
  const remoteGraph = await decryptCompleteGraph(bundle.envelope, passphrase);
  const localGraph = createGraphBackup(localConcepts, localConnections);
  const preview = previewGraphSyncConflict(localGraph, remoteGraph);
  return { bundle, remoteGraph, preview };
}

export async function mergePeerBundle(rawBundle: string, passphrase: string, localConcepts: any[], localConnections: any[], strategy: "merge" | "local" | "remote"): Promise<GraphBackup> {
  const { remoteGraph } = await parseAndPreviewPeerBundle(rawBundle, passphrase, localConcepts, localConnections);
  const localGraph = createGraphBackup(localConcepts, localConnections);
  return resolveGraphSyncConflict(localGraph, remoteGraph, strategy);
}
