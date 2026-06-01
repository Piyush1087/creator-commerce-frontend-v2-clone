import type { WizardData } from "../types/campaign-wizard";
import type {
  IntegratedCampaignWizardPayload,
  Step1StrategyPayload,
  Step2TargetingPayload,
  Step3CommercialsPayload,
} from "../schemas/campaign-wizard-schema";

const OBJECTIVE_TO_API: Record<string, Step1StrategyPayload["core_objective"]> = {
  "Brand Awareness": "BRAND_AWARENESS",
  "Traffic & Clicks": "TRAFFIC_CLICKS",
  "Sales & Conversions": "SALES_CONVERSIONS",
};

const PAYOUT_TO_API: Record<string, Step3CommercialsPayload["final_balance_terms"]> = {
  "Immediate (Upon Approval)": "IMMEDIATE",
  "Net 7": "NET_7",
  "Net 15": "NET_15",
  "Net 30": "NET_30",
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
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed.toISOString();
}

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
    fixed_start_date:
      data.timeline === "fixed" ? dateInputToIso(data.startDate, false) : null,
    fixed_end_date:
      data.timeline === "fixed" ? dateInputToIso(data.endDate, true) : null,
    dynamic_days_limit:
      data.timeline === "milestone"
        ? Number.parseInt(data.milestoneDays, 10) || null
        : null,
    core_objective: (OBJECTIVE_TO_API[data.objective] ??
      "") as Step1StrategyPayload["core_objective"],
    platform_deliverables,
  };
}

export function mapWizardToStep2Payload(data: WizardData): Step2TargetingPayload {
  return {
    industry_vertical: data.industry,
    creator_archetypes: data.archetypes,
    follower_tiers: data.followerTiers,
    audience_age_min: data.ageMin,
    audience_age_max: data.ageMax,
    audience_gender: GENDER_TO_API[data.genderFocus] ?? data.genderFocus,
    target_locations: data.targetLocations,
    disqualifying_keywords: data.disqualifyingKeywords,
  };
}

export function mapWizardToStep3Payload(data: WizardData): Step3CommercialsPayload {
  const isFixed = data.compensationType === "fixed";
  return {
    compensation_type: isFixed ? "FIXED_FEE" : "NEGOTIABLE",
    fixed_fee_amount: isFixed ? data.flatRatePerCreator : 0,
    negotiable_min_fee: isFixed ? 0 : data.negotiableMinFee,
    negotiable_max_fee: isFixed ? 0 : data.negotiableMaxFee,
    total_campaign_budget_pool: data.budget,
    advance_payment_percentage: data.advancePercent,
    final_balance_terms:
      PAYOUT_TO_API[data.payoutTerms] ?? "IMMEDIATE",
  };
}

export function mapWizardToIntegratedPayload(
  data: WizardData,
): IntegratedCampaignWizardPayload {
  return {
    strategy: mapWizardToStep1Payload(data),
    targeting: mapWizardToStep2Payload(data),
    commercials: mapWizardToStep3Payload(data),
  };
}
