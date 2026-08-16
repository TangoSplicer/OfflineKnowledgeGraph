export const FIRST_CONCEPT_WIZARD_KEY = "offline-knowledge-graph.first-concept-wizard.v1";

export type FirstConceptWizardStatus = "skipped" | "completed" | "completed-with-connection";

export const validateWizardTitle = (title: string) =>
  title.trim() ? null : "Give your concept a short name to continue.";

export const validateWizardNote = (note: string) =>
  note.trim() ? null : "Add one sentence so your future self knows why this idea matters.";

export const wizardCompletionStatus = (hasConnection: boolean): FirstConceptWizardStatus =>
  hasConnection ? "completed-with-connection" : "completed";

export const previousWizardStep = (current: 1 | 2 | 3): 1 | 2 | 3 | null =>
  current === 1 ? null : ((current - 1) as 1 | 2 | 3);
