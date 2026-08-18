import { describe, expect, it } from "vitest";
import type { CampaignAudienceGeography, WizardData } from "../../types/campaign-wizard";
import { validateCampaignWizardStep } from "../../utils/validate-campaign-wizard";
import { CREATOR_ARCHETYPES, affinityResults, archetypeLabel, creatorStrategyCanContinue, creatorStrategySummary, filterArchetypes, formatInteger, geographyOptionSelected, parseGroupedInteger, providerFailureCopy, toggleCanonicalValue } from "./creator-strategy-model";

const india: CampaignAudienceGeography = { scope: "COUNTRY", label: "India", country_code: "IN", locality: null, region: null, radius_km: null, is_primary: true };
const data = { name: "Summer Collection — Creator Seeding", objective: "PULSE", archetypes: ["EDUCATOR", "PRODUCT_REVIEWER", "STORYTELLER"], minimumFollowers: 20000, maximumFollowers: 250000, audienceAgeMin: 24, audienceAgeMax: 34, audienceGender: "FEMALE", affinityIds: ["SKINCARE", "BEAUTY"], audienceGeographies: [india] } as WizardData;

describe("Creator Strategy model", () => {
  it("exposes stable canonical archetype IDs and product labels", () => {
    expect(CREATOR_ARCHETYPES).toHaveLength(30);
    expect(archetypeLabel("PRODUCT_REVIEWER")).toBe("Product Reviewer");
    expect(filterArchetypes("review", [])).toEqual([["PRODUCT_REVIEWER", "Product Reviewer"]]);
  });

  it("adds and removes atomically and enforces the maximum", () => {
    expect(toggleCanonicalValue(["EDUCATOR"], "STORYTELLER", 5)).toEqual(["EDUCATOR", "STORYTELLER"]);
    expect(toggleCanonicalValue(["EDUCATOR"], "EDUCATOR", 5)).toEqual([]);
    const full = ["A", "B", "C", "D", "E"];
    expect(toggleCanonicalValue(full, "F", 5)).toEqual(full);
  });

  it("transforms grouped numeric presentation without corrupting integers", () => {
    expect(parseGroupedInteger("2,50,000")).toBe(250000);
    expect(parseGroupedInteger("20 000")).toBe(20000);
    expect(parseGroupedInteger("20k")).toBeNull();
    expect(formatInteger(250000)).toBe("2,50,000");
  });

  it("validates follower and age cross-field rules and navigation", () => {
    expect(creatorStrategyCanContinue(data)).toBe(true);
    expect(creatorStrategyCanContinue({ ...data, maximumFollowers: 20000 })).toBe(false);
    expect(creatorStrategyCanContinue({ ...data, audienceAgeMin: 35 })).toBe(false);
    const result = validateCampaignWizardStep(2, { ...data, maximumFollowers: 20000 });
    expect(result.success).toBe(false);
  });

  it("maps all canonical genders through validation", () => {
    for (const audienceGender of ["ALL", "FEMALE", "MALE"] as const) expect(validateCampaignWizardStep(2, { ...data, audienceGender }).success).toBe(true);
  });

  it("derives selected Geography and safe provider states", () => {
    expect(geographyOptionSelected([india], { ...india })).toBe(true);
    expect(providerFailureCopy("configuration")).not.toMatch(/api|key|google|environment/i);
    expect(providerFailureCopy("network")).toContain("temporarily unavailable");
  });

  it("filters canonical affinities and excludes selected IDs", () => {
    expect(affinityResults("skin", []).map((item) => item.id)).toContain("SKINCARE");
    expect(affinityResults("skin", ["SKINCARE"]).map((item) => item.id)).not.toContain("SKINCARE");
  });

  it("derives the compact Step 2 Summary without speculative metrics", () => {
    expect(creatorStrategySummary(data)).toEqual([
      { label: "Campaign", value: "Summer Collection — Creator Seeding" },
      { label: "Objective", value: "Pulse — Awareness & Reach" },
      { label: "Archetypes", value: "3 selected" },
      { label: "Followers", value: "20,000 – 2,50,000" },
      { label: "Audience", value: "Female · 24–34" },
      { label: "Geography", value: "India" },
    ]);
  });
});
