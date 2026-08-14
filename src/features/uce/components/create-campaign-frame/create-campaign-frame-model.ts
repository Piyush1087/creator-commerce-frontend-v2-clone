import { AUTH_ROUTES } from "../../../auth/constants";
import type { AutosaveStatus } from "../../autosave/canonical-campaign-autosave-controller";

export type WizardStep = 1 | 2 | 3;
export type WizardProgressState = "completed" | "current" | "upcoming";
export type WizardInitializationState = "loading" | "ready" | "failed";

export const WIZARD_STEP_LABELS = [
  "Campaign Strategy",
  "Creator Strategy",
  "Commercial Strategy",
] as const;

export function getWizardProgress(current: WizardStep) {
  return WIZARD_STEP_LABELS.map((label, index) => {
    const step = (index + 1) as WizardStep;
    const state: WizardProgressState = step < current
      ? "completed"
      : step === current
        ? "current"
        : "upcoming";
    return { step, label, state };
  });
}

export function getAutosavePresentation(statuses: AutosaveStatus[]) {
  if (statuses.includes("failed-retryable")) {
    return { state: "failed" as const, label: "Couldn't save changes", canRetry: true };
  }
  if (statuses.some((status) => status === "dirty" || status === "saving")) {
    return { state: "saving" as const, label: "Saving…", canRetry: false };
  }
  return { state: "saved" as const, label: "Saved just now", canRetry: false };
}

export function retryFailedAutosaves<Key extends string>(
  keys: Key[],
  status: (key: Key) => AutosaveStatus,
  retry: (key: Key) => void,
) {
  keys.filter((key) => status(key) === "failed-retryable").forEach((key) => retry(key));
}

export function getWizardActions(step: WizardStep, busy: boolean, blocked: boolean) {
  return {
    secondary: step === 1 ? "Cancel" : "Back",
    primary: step === 3 ? "Publish Campaign" : "Continue",
    primaryBusy: step === 3 && busy ? "Publishing Campaign…" : null,
    disabled: busy || blocked,
  };
}

export function getWizardVisibility(initialization: WizardInitializationState) {
  return {
    showForm: initialization === "ready",
    showProgress: initialization === "ready",
    showSummary: initialization === "ready",
    showAutosave: initialization === "ready",
  };
}

export function shouldShowValidationSummary(attemptedStep: WizardStep | null, step: WizardStep) {
  return attemptedStep === step;
}

export function getInitialSummaryExpanded(isMobile: boolean) {
  return !isMobile;
}

export function toggleSummaryExpanded(expanded: boolean) {
  return !expanded;
}

export function retryInitialization(retry: () => void) {
  retry();
}

export const CAMPAIGNS_ROUTE = AUTH_ROUTES.brandUceCampaigns;
