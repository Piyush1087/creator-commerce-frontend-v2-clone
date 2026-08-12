import type { WizardData } from "../types/campaign-wizard";
import type {
  Step1StrategyPayload,
  Step2TargetingPayload,
  Step3CommercialsPayload,
} from "../schemas/campaign-wizard-schema";
import type { CanonicalCampaignWizardPayload } from "../schemas/canonical-campaign-wizard-schema";
import {
  toPersistenceCompensation,
  toPersistencePayoutTerms,
  toPersistenceVisibility,
} from "./phase1-campaign-adapters";
import { mapWizardToCanonicalPayload } from "./map-wizard-to-canonical-payload";

const LEGACY_OBJECTIVE_TO_API: Record<string, Step1StrategyPayload["core_objective"]> = {
  "Brand Awareness": "BRAND_AWARENESS",
  "Awareness & Reach": "BRAND_AWARENESS",
  "Trust & Validation": "BRAND_AWARENESS",
  "High-Quality Assets": "BRAND_AWARENESS",
  "Traffic & Clicks": "TRAFFIC_CLICKS",
  "Sales & Conversions": "SALES_CONVERSIONS",
  "Direct Action": "SALES_CONVERSIONS",
};

const PAYOUT_TO_API: Record<string, string> = {
  "Immediate (Upon Approval)": "IMMEDIATE",
  "Net 7": "NET_7",
  "Net 15": "NET_15",
  "Net 30": "NET_30",
  "Net 45": "NET_45",
  "Net 60": "NET_60",
};

const GENDER_TO_API: Record<string, string> = {
  All: "ALL",
  "Female-Skewing": "FEMALE_SKEWING",
  "Male-Skewing": "MALE_SKEWING",
};

const PLATFORM_KEY_TO_API = {
  instagram: "INSTAGRAM",
  tiktok: "TIKTOK",
  youtube: "YOUTUBE",
} as const;

function dateInputToIso(date: string, endOfDay: boolean): string | null {
  if (!date.trim()) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed.toISOString();
}

/** Compatibility mapper used only by the existing per-step validation UI. */
export function mapWizardToStep1Payload(data: WizardData): Step1StrategyPayload {
  const platform_deliverables = (
    Object.keys(data.platforms) as Array<keyof typeof PLATFORM_KEY_TO_API>
  )
    .filter((key) => data.platforms[key].enabled && data.platforms[key].formats.length > 0)
    .map((key) => ({
      platform: PLATFORM_KEY_TO_API[key],
      formats: data.platforms[key].formats,
    }));

  return {
    campaign_name: data.name.trim(),
    timeline_type: data.timeline === "fixed" ? "FIXED_DATES" : "DYNAMIC_MILESTONES",
    fixed_start_date: data.timeline === "fixed" ? dateInputToIso(data.startDate, false) : null,
    fixed_end_date: data.timeline === "fixed" ? dateInputToIso(data.endDate, true) : null,
    dynamic_days_limit:
      data.timeline === "milestone" ? Number.parseInt(data.milestoneDays, 10) || null : null,
    core_objective: (LEGACY_OBJECTIVE_TO_API[data.objective] ?? "") as Step1StrategyPayload["core_objective"],
    platform_deliverables,
  };
}

/** Compatibility mapper used only by the existing per-step validation UI. */
export function mapWizardToStep2Payload(data: WizardData): Step2TargetingPayload {
  const visibility = toPersistenceVisibility("PUBLIC");
  return {
    industry_vertical: data.industry,
    creator_archetypes: data.archetypes,
    follower_tiers: data.followerTiers,
    audience_age_min: data.ageMin,
    audience_age_max: data.ageMax,
    audience_gender: GENDER_TO_API[data.genderFocus] ?? data.genderFocus,
    target_locations: data.targetLocations,
    disqualifying_keywords: data.disqualifyingKeywords,
    campaign_visibility: "PUBLIC",
    visibility_scopes: [visibility],
  };
}

/** Compatibility mapper used only by the existing per-step validation UI. */
export function mapWizardToStep3Payload(data: WizardData): Step3CommercialsPayload {
  const isFixed = data.compensationType === "fixed";
  const payout = toPersistencePayoutTerms(PAYOUT_TO_API[data.payoutTerms] ?? "NET_30");
  return {
    compensation_type: isFixed
      ? toPersistenceCompensation("FIXED")
      : toPersistenceCompensation("NEGOTIABLE"),
    fixed_fee_amount: isFixed ? data.flatRatePerCreator : 0,
    negotiable_min_fee: isFixed ? 0 : data.negotiableMinFee,
    negotiable_max_fee: isFixed ? 0 : data.negotiableMaxFee,
    total_campaign_budget_pool: data.budget,
    advance_payment_percentage: data.advancePercent,
    final_balance_terms: payout as Step3CommercialsPayload["final_balance_terms"],
  };
}

/**
 * Final Create Campaign submission is canonical Phase 1 data. The old step
 * mappers above are temporary presentation-validation compatibility only.
 */
export function mapWizardToIntegratedPayload(
  data: WizardData,
): CanonicalCampaignWizardPayload {
  return mapWizardToCanonicalPayload(data);
}
