import { describe, expect, it, vi } from "vitest";

import {
  CAMPAIGNS_ROUTE,
  getAutosavePresentation,
  getWizardActions,
  getWizardProgress,
  getWizardVisibility,
  getInitialSummaryExpanded,
  retryFailedAutosaves,
  retryInitialization,
  shouldShowValidationSummary,
  toggleSummaryExpanded,
} from "./create-campaign-frame-model";

describe("Create Campaign frame model", () => {
  it.each([1, 2, 3] as const)("derives semantic progress for step %s", (step) => {
    const progress = getWizardProgress(step);
    expect(progress.filter((item) => item.state === "current")).toEqual([progress[step - 1]]);
    expect(progress.slice(0, step - 1).every((item) => item.state === "completed")).toBe(true);
    expect(progress.slice(step).every((item) => item.state === "upcoming")).toBe(true);
  });

  it.each([
    [["idle"], "Saved just now", false],
    [["dirty"], "Saving…", false],
    [["saving"], "Saving…", false],
    [["idle", "failed-retryable"], "Couldn't save changes", true],
    [["saving", "failed-retryable"], "Couldn't save changes", true],
  ] as const)("maps autosave state", (statuses, label, canRetry) => {
    expect(getAutosavePresentation([...statuses])).toMatchObject({ label, canRetry });
  });

  it.each([
    [1, "Cancel", "Continue"],
    [2, "Back", "Continue"],
    [3, "Back", "Publish Campaign"],
  ] as const)("derives desktop and mobile actions for step %s", (step, secondary, primary) => {
    expect(getWizardActions(step, false, false)).toMatchObject({ secondary, primary, disabled: false });
  });

  it("disables actions while busy or blocked", () => {
    expect(getWizardActions(3, true, false)).toMatchObject({ disabled: true, primaryBusy: "Publishing Campaign…" });
    expect(getWizardActions(1, false, true).disabled).toBe(true);
  });

  it("hides interactive regions while initialization is unresolved or failed", () => {
    for (const state of ["loading", "failed"] as const) {
      expect(getWizardVisibility(state)).toEqual({ showForm: false, showProgress: false, showSummary: false, showAutosave: false });
    }
    expect(getWizardVisibility("ready").showForm).toBe(true);
  });

  it("shows validation summary only for the failed navigation step", () => {
    expect(shouldShowValidationSummary(null, 1)).toBe(false);
    expect(shouldShowValidationSummary(1, 1)).toBe(true);
    expect(shouldShowValidationSummary(1, 2)).toBe(false);
  });

  it("uses the canonical Campaign list route", () => {
    expect(CAMPAIGNS_ROUTE).toBe("/brand/uce/campaigns");
  });

  it("starts mobile Summary collapsed and toggles disclosure state", () => {
    expect(getInitialSummaryExpanded(true)).toBe(false);
    expect(toggleSummaryExpanded(false)).toBe(true);
    expect(toggleSummaryExpanded(true)).toBe(false);
  });

  it("delegates initialization Retry", () => {
    const retry = vi.fn();
    retryInitialization(retry);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("delegates retry without changing unrelated keys", () => {
    const retry = vi.fn();
    const statuses = { name: "failed-retryable", objective: "saved", visibility: "failed-retryable" } as const;
    retryFailedAutosaves(Object.keys(statuses) as Array<keyof typeof statuses>, (key) => statuses[key], retry);
    expect(retry.mock.calls).toEqual([["name"], ["visibility"]]);
  });
});
