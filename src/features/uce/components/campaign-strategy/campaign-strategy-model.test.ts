import { describe, expect, it } from "vitest";

import type { WizardData } from "../../types/campaign-wizard";
import { validateCampaignWizardStep } from "../../utils/validate-campaign-wizard";
import { campaignReadinessPresentation, campaignStrategyNavigationBlocked, campaignStrategySummary, CAMPAIGN_OBJECTIVES, kpiDisplayLabel, radioNavigationIndex, scheduleSelectionPatch, showScheduledDates } from "./campaign-strategy-model";

const data = { name: " Summer Collection ", objective: "PULSE", publishingSchedule: "SCHEDULED", publishFrom: "2026-09-15", publishUntil: "2026-10-15", visibility: "ELIGIBLE_CREATORS_ONLY" } as WizardData;

describe("Campaign Strategy presentation", () => {
  it("freezes the four canonical Objective cards", () => {
    expect(CAMPAIGN_OBJECTIVES.map(({ value, name, outcome }) => ({ value, name, outcome }))).toEqual([
      { value: "PULSE", name: "Pulse", outcome: "Awareness & Reach" },
      { value: "PROOF", name: "Proof", outcome: "Trust & Validation" },
      { value: "PRODUCTION", name: "Production", outcome: "High-Quality Assets" },
      { value: "PUSH", name: "Push", outcome: "Direct Action" },
    ]);
  });

  it.each([["DISCOVER_REACH", "Discover Reach"], ["PROFILE_VISITS", "Profile Visits"], ["ASSET_QUALITY_SCORE", "Asset Quality Score"], ["CTR", "CTR"]])("maps KPI %s to approved label", (value, label) => expect(kpiDisplayLabel(value)).toBe(label));

  it("hides dates for Evergreen and shows them for Scheduled", () => {
    expect(showScheduledDates("EVERGREEN")).toBe(false);
    expect(showScheduledDates("SCHEDULED")).toBe(true);
  });

  it("clears scheduled dates when Evergreen is selected", () => {
    expect(scheduleSelectionPatch("EVERGREEN")).toEqual({ publishingSchedule: "EVERGREEN", publishFrom: "", publishUntil: "" });
    expect(scheduleSelectionPatch("SCHEDULED")).toEqual({ publishingSchedule: "SCHEDULED" });
  });

  it.each([
    ["ArrowRight", 0, 1], ["ArrowDown", 1, 2], ["ArrowLeft", 0, 3],
    ["ArrowUp", 2, 1], ["Home", 3, 0], ["End", 0, 3],
  ])("moves custom radio focus for %s", (key, current, expected) => {
    expect(radioNavigationIndex(key, current, 4)).toBe(expected);
  });

  it("ignores unrelated custom-radio keys", () => {
    expect(radioNavigationIndex("Tab", 1, 4)).toBeNull();
  });

  it.each(["idle", "not-ready"] as const)("hides metrics for %s", (status) => {
    const state = status === "idle" ? { status } as const : { status, campaignId: "c", reason: "OBJECTIVE_REQUIRED" } as const;
    expect(campaignReadinessPresentation(state)).toEqual({ kind: "hidden" });
  });

  it("derives resolving, ready and safe failure states", () => {
    expect(campaignReadinessPresentation({ status: "resolving", campaignId: "c", objective: "PULSE" }).kind).toBe("resolving");
    expect(campaignReadinessPresentation({ status: "ready", campaignId: "c", objective: "PULSE", currency: "INR", primaryKpi: "REACH", supportingKpis: ["IMPRESSIONS"], revision: "r" })).toEqual({ kind: "ready", primary: "Reach", supporting: ["Impressions"] });
    expect(campaignReadinessPresentation({ status: "failed-retryable", campaignId: "c", objective: "PULSE", reason: "READINESS_TEMPORARILY_UNAVAILABLE", retryable: true })).toMatchObject({ kind: "retryable-failure", canRetry: true });
    expect(campaignReadinessPresentation({ status: "failed-non-retryable", campaignId: "c", objective: "PULSE", reason: "SUPPORTING_KPI_CONFIGURATION_UNAVAILABLE", retryable: false })).toMatchObject({ kind: "configuration-failure", canRetry: false });
  });

  it("blocks navigation while resolving, failed or autosave-failed", () => {
    const ready = { status: "ready", campaignId: "c", objective: "PULSE", currency: "INR", primaryKpi: "REACH", supportingKpis: ["IMPRESSIONS"], revision: "r" } as const;
    expect(campaignStrategyNavigationBlocked({ status: "resolving", campaignId: "c", objective: "PULSE" }, false)).toBe(true);
    expect(campaignStrategyNavigationBlocked({ status: "failed-retryable", campaignId: "c", objective: "PULSE", reason: "READINESS_TEMPORARILY_UNAVAILABLE", retryable: true }, false)).toBe(true);
    expect(campaignStrategyNavigationBlocked(ready, true)).toBe(true);
    expect(campaignStrategyNavigationBlocked(ready, false)).toBe(false);
  });

  it("derives the compact authoritative Step 1 Summary", () => {
    expect(campaignStrategySummary(data)).toEqual([
      { label: "Name", value: "Summer Collection" },
      { label: "Objective", value: "Pulse — Awareness & Reach" },
      { label: "Schedule", value: "15 Sept 2026 – 15 Oct 2026" },
      { label: "Platform", value: "Instagram" },
      { label: "Visibility", value: "Eligible Creators Only" },
    ]);
  });

  it("keeps Platform fixed and absent from authored state", () => {
    expect(campaignStrategySummary({ ...data, visibility: "PUBLIC" })[3]).toEqual({ label: "Platform", value: "Instagram" });
  });

  it("uses approved Campaign Name and scheduled-date validation copy", () => {
    const result = validateCampaignWizardStep(1, { ...data, name: "", publishUntil: "2026-09-14" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.name).toBe("Enter a Campaign name.");
      expect(result.fieldErrors.publishUntil).toBe("Publish Until must be after Publish From.");
    }
  });
});
