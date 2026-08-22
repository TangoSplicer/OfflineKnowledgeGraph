import {
  type LocalExportDestinationCheck,
  type LocalExportStatus,
} from "./local-export-status";

export type ExportDestinationChecklistItem = {
  id: LocalExportDestinationCheck;
  title: string;
  detail: string;
  complete: boolean;
};

const destinationChecklistCopy: Omit<ExportDestinationChecklistItem, "complete">[] = [
  {
    id: "trusted-folder",
    title: "Moved from the temporary download area",
    detail: "I saved the ZIP in a trusted folder or service I can reach outside the app.",
  },
  {
    id: "second-copy",
    title: "Kept a second trusted copy",
    detail: "I made a separate copy when this graph matters beyond one device.",
  },
  {
    id: "recovery-plan",
    title: "Planned a recovery check",
    detail: "I know where to test restore safely, and where the passphrase is kept when this ZIP is protected.",
  },
];

export function exportDestinationChecklist(status: LocalExportStatus): ExportDestinationChecklistItem[] {
  return destinationChecklistCopy.map((item) => ({
    ...item,
    complete: status.exportDestinationChecks.includes(item.id),
  }));
}

export function hasCompletedExportDestinationChecklist(status: LocalExportStatus): boolean {
  return exportDestinationChecklist(status).every((item) => item.complete);
}
