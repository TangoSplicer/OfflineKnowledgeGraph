import type { LocalExportStatus } from "./local-export-status";

export type FirstExportChecklistStep = {
  id: "review" | "protection" | "export";
  title: string;
  detail: string;
  actionLabel?: string;
  complete: boolean;
};

export function shouldShowFirstExportChecklist(status: LocalExportStatus): boolean {
  return !status.lastExportedAt;
}

export function firstExportChecklist(conceptCount: number, relationshipCount: number, isProtectedExport: boolean): FirstExportChecklistStep[] {
  const graphSummary = `${Math.max(0, conceptCount)} concepts and ${Math.max(0, relationshipCount)} relationships`;
  return [
    { id: "review", title: "Review what will be saved", detail: `Your ZIP will include ${graphSummary} plus a graph image.`, complete: true },
    { id: "protection", title: isProtectedExport ? "Protection is selected" : "Choose protection", detail: isProtectedExport ? "Create and confirm a passphrase below before saving the protected ZIP." : "A standard ZIP is ready. Add a passphrase if this graph is sensitive.", actionLabel: isProtectedExport ? undefined : "Add passphrase", complete: isProtectedExport },
    { id: "export", title: "Save your first local copy", detail: isProtectedExport ? "Complete the passphrase fields below, then create the protected ZIP." : "Use the export button below to save the ZIP through your device share sheet.", actionLabel: isProtectedExport ? undefined : "Export ZIP", complete: false },
  ];
}
